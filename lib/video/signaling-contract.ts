import { createHmac } from "node:crypto";
import { z } from "zod";

export const signalingMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join_room"), appointmentId: z.string().uuid() }),
  z.object({ type: z.literal("offer"), appointmentId: z.string().uuid(), sdp: z.string().min(1).max(100_000) }),
  z.object({ type: z.literal("answer"), appointmentId: z.string().uuid(), sdp: z.string().min(1).max(100_000) }),
  z.object({ type: z.literal("ice_candidate"), appointmentId: z.string().uuid(), candidate: z.string().max(10_000), sdpMid: z.string().nullable().optional(), sdpMLineIndex: z.number().int().nullable().optional() }),
  z.object({ type: z.literal("chat_message"), appointmentId: z.string().uuid(), body: z.string().trim().min(1).max(2_000) }),
]);

export type SignalingMessage = z.infer<typeof signalingMessageSchema>;

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

/**
 * Build a ten-minute LiveKit JWT for an already authenticated participant.
 * Call only after server-side session, appointment access, and consent checks.
 * This helper never authenticates a user or grants access on its own.
 */
export function createAppointmentLiveKitToken({ appointmentId, verifiedParticipantId, now = new Date() }: { appointmentId: string; verifiedParticipantId: string; now?: Date }) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error("LiveKit server credentials are not configured.");
  if (!appointmentId || !verifiedParticipantId) throw new Error("An authorized participant and appointment are required.");
  const issuedAt = Math.floor(now.getTime() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: apiKey,
    sub: verifiedParticipantId,
    nbf: issuedAt - 5,
    iat: issuedAt,
    exp: issuedAt + 10 * 60,
    video: { roomJoin: true, room: `APPT_${appointmentId}`, canPublish: true, canSubscribe: true, canPublishData: true },
    metadata: JSON.stringify({ appointment_id: appointmentId }),
  }));
  const content = `${header}.${payload}`;
  const signature = createHmac("sha256", apiSecret).update(content).digest("base64url");
  return `${content}.${signature}`;
}
