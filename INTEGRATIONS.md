# Integration and deployment boundary

Carewell is an interactive demonstration with PostgreSQL/Prisma schema and migration assets. The preview currently uses fictional clinician profiles and process-local sample availability. It has no configured PostgreSQL or Redis connection, authenticated users, payment credentials, video room, notification transport, AWS account, or clinical record store.

## Provider activation points

- **Database:** set `DATABASE_URL` in protected project runtime configuration, apply the checked-in Prisma migrations, add authenticated tenant/role controls, and replace demo repositories with database transactions. The managed database service offered by this project host is MySQL; this implementation intentionally keeps PostgreSQL as specified.
- **Redis:** set `REDIS_URL` and use a shared Redis lock with an atomic five-minute expiration for booking holds. Current holds exist only in the single Node process and are not distributed.
- **Video:** configure LiveKit or a production Socket.IO/WebSocket signaling service, appointment-bound authorization and short-lived JWTs; provision STUN/TURN (coturn), WSS, moderation and consent policies. The preview offers local camera/mic/screen-share permission controls only; no remote participant is connected.
- **Payments:** provision Stripe Connect and Razorpay Route accounts, configure protected keys, webhook signature verification, idempotency, transfer/refund reconciliation and jurisdiction-specific escrow/legal review. The preview never creates a real PaymentIntent, transfer, Razorpay order or charge.
- **Reminders:** configure Redis/BullMQ, FCM and Twilio, consent and unsubscribe/preferences, reliable delivery/retry/dead-letter handling. The preview sends no real email, SMS, WhatsApp or push notification.
- **HIPAA/security:** before real patient data, complete a threat model and security review; use eligible services and signed BAAs; enforce least privilege, access audit, encryption/key rotation, retention/deletion policy, incident response, backups/restore tests, consent, access controls, privacy notices and clinical/legal review. A UI or Terraform skeleton cannot by itself certify HIPAA compliance.

## Operational notes

All times persisted to PostgreSQL must be UTC `TIMESTAMPTZ`; convert only for display and calculations using validated IANA time zones. Keep patient notes out of analytics/logs. Do not put provider credentials in browser bundles or source control. Real payments and clinical records must remain disabled until the associated protected configuration and controls have been reviewed.
