import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", app: "carewell", mode: process.env.DATABASE_URL && process.env.REDIS_URL ? "configured" : "demo", capabilities: { postgres: Boolean(process.env.DATABASE_URL), redis: Boolean(process.env.REDIS_URL), video: Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET), stripe: Boolean(process.env.STRIPE_SECRET_KEY), razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET), notifications: Boolean(process.env.REDIS_URL && process.env.FCM_PROJECT_ID && process.env.TWILIO_ACCOUNT_SID) } }, { headers: { "Cache-Control": "no-store" } });
}
