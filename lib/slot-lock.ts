import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import type { Slot, SlotHold } from "@/lib/availability";
import { acquireDemoHold } from "@/lib/availability";

let redis: Redis | undefined;
function getRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  redis ??= new Redis(url, { maxRetriesPerRequest: 1, enableReadyCheck: true });
  return redis;
}

export async function acquireSlotLock(doctorId: string, start: Date): Promise<SlotHold | null> {
  const client = getRedisClient();
  if (!client) {
    if (process.env.DATABASE_URL) throw new Error("PostgreSQL is configured but Redis is not; distributed slot holds are unavailable.");
    return acquireDemoHold(doctorId, start);
  }
  const key = `slot_lock:${doctorId}:${start.toISOString()}`;
  const holdId = randomUUID();
  const stored = await client.set(key, holdId, "EX", 300, "NX");
  if (stored !== "OK") return null;
  return { holdId, doctorId, start, expiresAt: new Date(Date.now() + 300_000), demo: false };
}

export async function applyRedisSlotLocks(doctorId: string, slots: Slot[]) {
  const client = getRedisClient();
  if (!client || slots.length === 0) return slots;
  const keys = slots.map((slot) => `slot_lock:${doctorId}:${slot.start}`);
  const values = await client.mget(keys);
  return slots.map((slot, index) => values[index] ? { ...slot, status: "booked" as const } : slot);
}

export async function closeSlotLockConnection() {
  await redis?.quit();
  redis = undefined;
}
