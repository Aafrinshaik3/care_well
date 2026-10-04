type StripeIntent = { id: string; client_secret: string | null; status: string; transfer_group?: string };
type StripeTransfer = { id: string; amount: number; destination: string; transfer_group: string };
type StripeRefund = { id: string; status: string; payment_intent: string };

async function stripeRequest<T>(path: string, method: "POST" | "GET", params?: URLSearchParams, idempotencyKey?: string): Promise<T> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe is not configured; no payment request was sent.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${secret}`, ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    body: method === "POST" ? params?.toString() : undefined,
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(`Stripe request failed (${response.status}): ${result?.error?.type ?? "provider_error"}`);
  return result as T;
}

export async function createStripePaymentIntent({ appointmentId, amountMinor, currency = "inr" }: { appointmentId: string; amountMinor: number; currency?: string }) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("Payment amount must be a positive integer in the currency's minor unit.");
  const transferGroup = `APPT_${appointmentId}`;
  const params = new URLSearchParams({ amount: String(amountMinor), currency: currency.toLowerCase(), transfer_group: transferGroup, "metadata[appointment_id]": appointmentId, "metadata[payment_flow]": "carewell_escrow" });
  return stripeRequest<StripeIntent>("payment_intents", "POST", params, `carewell-intent-${appointmentId}`);
}

export async function releaseStripeDoctorShare({ appointmentId, appointmentStatus, doctorAccountId, amountMinor, currency = "inr" }: { appointmentId: string; appointmentStatus: string; doctorAccountId: string; amountMinor: number; currency?: string }) {
  if (appointmentStatus !== "completed") throw new Error("Doctor payout is only allowed after an appointment is completed.");
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured; no transfer was created.");
  const doctorShare = Math.floor(amountMinor * 0.8);
  const params = new URLSearchParams({ amount: String(doctorShare), currency: currency.toLowerCase(), destination: doctorAccountId, transfer_group: `APPT_${appointmentId}`, "metadata[appointment_id]": appointmentId, "metadata[share_percent]": "80" });
  return stripeRequest<StripeTransfer>("transfers", "POST", params, `carewell-transfer-${appointmentId}`);
}

export async function refundStripeAppointment({ appointmentId, paymentIntentId, appointmentStatus, scheduledStartTime, now = new Date() }: { appointmentId: string; paymentIntentId: string; appointmentStatus: "cancelled" | "no_show" | string; scheduledStartTime: Date; now?: Date }) {
  const eligible = appointmentStatus === "cancelled" || (appointmentStatus === "no_show" && now.getTime() >= scheduledStartTime.getTime() + 10 * 60_000);
  if (!eligible) throw new Error("Refund is not eligible until cancellation or the ten-minute no-show window has passed.");
  const params = new URLSearchParams({ payment_intent: paymentIntentId, reason: "requested_by_customer", "metadata[appointment_id]": appointmentId });
  return stripeRequest<StripeRefund>("refunds", "POST", params, `carewell-refund-${appointmentId}`);
}

async function razorpayRequest<T>(path: string, method: "POST" | "PATCH", payload: unknown): Promise<T> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured; no payment request was sent.");
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, { method, headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(`Razorpay request failed (${response.status}): ${result?.error?.code ?? "provider_error"}`);
  return result as T;
}

export async function createRazorpayRouteOrder({ appointmentId, amountMinor, currency = "INR", doctorAccountId }: { appointmentId: string; amountMinor: number; currency?: string; doctorAccountId: string }) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("Payment amount must be a positive integer in the currency's minor unit.");
  return razorpayRequest<{ id: string }>("orders", "POST", {
    amount: amountMinor, currency, receipt: `APPT_${appointmentId}`,
    transfers: [{ account: doctorAccountId, amount: Math.floor(amountMinor * 0.8), currency, on_hold: 1, notes: { appointment_id: appointmentId, flow: "carewell_escrow" } }],
  });
}

export async function releaseRazorpayTransfer({ paymentId, transferId, appointmentStatus }: { paymentId: string; transferId: string; appointmentStatus: string }) {
  if (appointmentStatus !== "completed") throw new Error("Razorpay transfer is only released after an appointment is completed.");
  return razorpayRequest(`payments/${encodeURIComponent(paymentId)}/transfers/${encodeURIComponent(transferId)}`, "PATCH", { on_hold: 0 });
}
