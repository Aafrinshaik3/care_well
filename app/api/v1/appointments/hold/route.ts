import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDoctorAvailability } from "@/lib/availability";
import { acquireSlotLock } from "@/lib/slot-lock";

const holdSchema = z.object({
  doctorId: z.string().min(1),
  startTime: z.string().datetime({ offset: true }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1).max(80),
  type: z.enum(["video", "in_clinic"]),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 }); }
  const parsed = holdSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Choose a doctor, visit type, date, timezone and available slot." }, { status: 400 });
  const { doctorId, startTime, date, timezone } = parsed.data;
  if (process.env.DATABASE_URL && process.env.AUTH_ENABLED !== "true") return NextResponse.json({ error: "Authentication must be configured before production appointment holds are enabled." }, { status: 401 });
  const start = new Date(startTime);
  if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) return NextResponse.json({ error: "That time has passed. Choose another slot." }, { status: 409 });
  try {
    const availability = await getDoctorAvailability({ doctorId, date, timezone });
    if (!availability) return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    const slot = availability.slots.find((item) => item.start === start.toISOString());
    if (!slot || slot.status !== "available") return NextResponse.json({ error: "That slot is no longer available. Refresh and choose another time." }, { status: 409 });
    const hold = await acquireSlotLock(doctorId, start);
    if (!hold) return NextResponse.json({ error: "That slot is already held. Please choose another time." }, { status: 409 });
    return NextResponse.json({ holdId: hold.holdId, expiresAt: hold.expiresAt.toISOString(), status: hold.demo ? "held_in_demo" : "held_in_redis", demo: hold.demo, message: hold.demo ? "Slot held for five minutes in this process-local demo. No payment was collected." : "Slot held for five minutes while checkout proceeds." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The slot hold service is not available. No payment was collected." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
