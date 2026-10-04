import { getDemoAppointments, doctors } from "@/lib/demo-data";
import { getPrismaClient } from "@/lib/db";
import { applyRedisSlotLocks } from "@/lib/slot-lock";

export type SlotStatus = "available" | "booked";
export type Slot = { start: string; end: string; localStart: string; localEnd: string; status: SlotStatus };
export type SlotHold = { holdId: string; doctorId: string; start: Date; expiresAt: Date; demo: boolean };
type Interval = { start: Date; end: Date };
type Schedule = { dayOfWeek: number; startTime: string | Date; endTime: string | Date };
type DatabaseSnapshot = { doctorTimezone: string; schedules: Schedule[]; appointments: Interval[]; leaves: Interval[] };

const APPOINTMENT_MINUTES = 15;
const BUFFER_MINUTES = 5;
const SLOT_STEP_MINUTES = APPOINTMENT_MINUTES + BUFFER_MINUTES;
const activeHolds = new Map<string, SlotHold>();
const DEMO_TIMEZONE = "Asia/Kolkata";
const DEMO_SCHEDULES: Schedule[] = [
  ...[1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, startTime: "09:00", endTime: "12:00" })),
  ...[1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({ dayOfWeek, startTime: "13:00", endTime: "17:00" })),
];

function partsAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day), hour: Number(values.hour), minute: Number(values.minute) };
}

function localDateKey(date: Date, timeZone: string) {
  const p = partsAt(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function addCalendarDays(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + offset, 12));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function validDateKey(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

// Resolve a wall-clock time in an IANA zone by iteratively correcting its UTC offset.
export function zonedTimeToUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = new Date(target);
  for (let i = 0; i < 4; i += 1) {
    const p = partsAt(guess, timeZone);
    const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0);
    const correction = target - represented;
    if (correction === 0) break;
    guess = new Date(guess.getTime() + correction);
  }
  return guess;
}

function intervalOverlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function formatLocalTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

function weekday(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function timeValue(value: Date | string) {
  if (value instanceof Date) return `${String(value.getUTCHours()).padStart(2, "0")}:${String(value.getUTCMinutes()).padStart(2, "0")}`;
  return value.slice(0, 5);
}

function getActiveHolds(doctorId: string) {
  const now = Date.now();
  for (const [key, hold] of activeHolds) if (hold.expiresAt.getTime() <= now) activeHolds.delete(key);
  return [...activeHolds.values()].filter((hold) => hold.doctorId === doctorId);
}

export function isSlotHeld(doctorId: string, start: Date) {
  return getActiveHolds(doctorId).some((hold) => intervalOverlaps(start, new Date(start.getTime() + APPOINTMENT_MINUTES * 60_000), hold.start, new Date(hold.start.getTime() + APPOINTMENT_MINUTES * 60_000)));
}

export function acquireDemoHold(doctorId: string, start: Date): SlotHold | null {
  if (isSlotHeld(doctorId, start)) return null;
  const holdId = `demo_${crypto.randomUUID()}`;
  const hold = { holdId, doctorId, start, expiresAt: new Date(Date.now() + 5 * 60_000), demo: true };
  activeHolds.set(holdId, hold);
  return hold;
}

function demoLeaves(doctorId: string, doctorDate: string): Interval[] {
  // Demonstration leave for one provider on a date three days from today, 14:00–15:00 local.
  if (doctorId !== "dr-meera-nair") return [];
  const leaveDate = addCalendarDays(localDateKey(new Date(), DEMO_TIMEZONE), 3);
  if (doctorDate !== leaveDate) return [];
  const start = zonedTimeToUtc(doctorDate, "14:00", DEMO_TIMEZONE);
  return [{ start, end: zonedTimeToUtc(doctorDate, "15:00", DEMO_TIMEZONE) }];
}

export function generateSlots({ doctorId, date, timezone, snapshot }: { doctorId: string; date: string; timezone: string; snapshot?: DatabaseSnapshot }): Slot[] {
  new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  if (!validDateKey(date)) throw new Error("Invalid calendar date.");
  const doctor = doctors.find((item) => item.id === doctorId);
  if (!snapshot && !doctor) return [];

  const doctorTimezone = snapshot?.doctorTimezone ?? DEMO_TIMEZONE;
  const schedules = snapshot?.schedules ?? DEMO_SCHEDULES;
  const clientDayStart = zonedTimeToUtc(date, "00:00", timezone);
  const clientNextDayStart = zonedTimeToUtc(addCalendarDays(date, 1), "00:00", timezone);
  const sampleAppointments = snapshot ? snapshot.appointments : getDemoAppointments().filter((item) => item.doctorId === doctorId).map((item) => ({ start: item.start, end: new Date(item.start.getTime() + APPOINTMENT_MINUTES * 60_000) }));
  const holds = getActiveHolds(doctorId).map((hold) => ({ start: hold.start, end: new Date(hold.start.getTime() + APPOINTMENT_MINUTES * 60_000) }));
  const results: Slot[] = [];

  // The client-local date can intersect two doctor-local dates; inspect adjacent clinic days.
  for (let offset = -1; offset <= 1; offset += 1) {
    const doctorDate = addCalendarDays(date, offset);
    const day = weekday(doctorDate);
    for (const schedule of schedules.filter((item) => item.dayOfWeek === day)) {
      const shiftStart = timeToMinutes(timeValue(schedule.startTime));
      const shiftEnd = timeToMinutes(timeValue(schedule.endTime));
      for (let minute = shiftStart; minute + APPOINTMENT_MINUTES + BUFFER_MINUTES <= shiftEnd; minute += SLOT_STEP_MINUTES) {
        const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
        const start = zonedTimeToUtc(doctorDate, time, doctorTimezone);
        const end = new Date(start.getTime() + APPOINTMENT_MINUTES * 60_000);
        const bufferEnd = new Date(end.getTime() + BUFFER_MINUTES * 60_000);
        if (start < clientDayStart || start >= clientNextDayStart || start.getTime() <= Date.now()) continue;
        if (localDateKey(start, timezone) !== date) continue;

        const fixedDemoBookings = snapshot ? [] : ["10:40", "14:20"].map((bookedTime) => {
          const bookedStart = zonedTimeToUtc(doctorDate, bookedTime, doctorTimezone);
          return { start: bookedStart, end: new Date(bookedStart.getTime() + APPOINTMENT_MINUTES * 60_000) };
        });
        const booked = [...sampleAppointments, ...fixedDemoBookings].some((item) => intervalOverlaps(start, bufferEnd, item.start, item.end));
        const leave = (snapshot?.leaves ?? demoLeaves(doctorId, doctorDate)).some((item) => intervalOverlaps(start, bufferEnd, item.start, item.end));
        const held = holds.some((item) => intervalOverlaps(start, bufferEnd, item.start, item.end));
        results.push({ start: start.toISOString(), end: end.toISOString(), localStart: formatLocalTime(start, timezone), localEnd: formatLocalTime(end, timezone), status: booked || leave || held ? "booked" : "available" });
      }
    }
  }
  return results.sort((a, b) => a.start.localeCompare(b.start));
}

export async function getDoctorAvailability({ doctorId, date, timezone }: { doctorId: string; date: string; timezone: string }) {
  new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
  if (!validDateKey(date)) throw new Error("Invalid calendar date.");
  const prisma = getPrismaClient();
  let slots: Slot[];
  let source: "demo" | "postgres" = "demo";
  if (!prisma) {
    if (!doctors.some((item) => item.id === doctorId)) return null;
    slots = generateSlots({ doctorId, date, timezone });
  } else {
    const dayStart = zonedTimeToUtc(date, "00:00", timezone);
    const dayEnd = zonedTimeToUtc(addCalendarDays(date, 1), "00:00", timezone);
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        schedules: { where: { isActive: true } },
        appointments: { where: { scheduledStartTime: { lt: dayEnd }, scheduledEndTime: { gt: dayStart }, status: { not: "cancelled" } } },
        leaves: { where: { isActive: true, startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } } },
      },
    });
    if (!doctor) return null;
    source = "postgres";
    slots = generateSlots({ doctorId, date, timezone, snapshot: {
      doctorTimezone: doctor.timezone,
      schedules: doctor.schedules.map((schedule) => ({ dayOfWeek: schedule.dayOfWeek, startTime: schedule.startTime, endTime: schedule.endTime })),
      appointments: doctor.appointments.map((appointment) => ({ start: appointment.scheduledStartTime, end: appointment.scheduledEndTime })),
      leaves: doctor.leaves.map((leave) => ({ start: leave.startsAt, end: leave.endsAt })),
    } });
  }
  slots = await applyRedisSlotLocks(doctorId, slots);
  return { slots, source, rules: SLOT_RULES };
}

export const SLOT_RULES = { appointmentMinutes: APPOINTMENT_MINUTES, bufferMinutes: BUFFER_MINUTES, cadenceMinutes: SLOT_STEP_MINUTES };
