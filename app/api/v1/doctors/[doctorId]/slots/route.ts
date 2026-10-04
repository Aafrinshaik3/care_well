import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDoctorAvailability } from "@/lib/availability";

const querySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), timezone: z.string().min(1).max(80).default("UTC") });
type Params = Promise<{ doctorId: string }>;

export async function GET(request: NextRequest, context: { params: Params }) {
  const { doctorId } = await context.params;
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Provide date=YYYY-MM-DD and a valid IANA timezone." }, { status: 400 });
  try {
    const { date, timezone } = parsed.data;
    const availability = await getDoctorAvailability({ doctorId, date, timezone });
    if (!availability) return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    return NextResponse.json({ doctorId, date, timezone, rules: availability.rules, source: availability.source, slots: availability.slots }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The supplied date or timezone is not valid, or availability could not be loaded." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
