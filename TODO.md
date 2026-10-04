# Carewell implementation outcomes

## 1. Build the modular full-stack platform on the requested stack

- Build a production-oriented, full-stack Practo-clone telemedicine and doctor-booking web platform with a scalable, secure, high-performance architecture and HIPAA-compliant design standards.
- Use Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn UI, Framer Motion and Lucide Icons for the frontend.
- Use Node.js/TypeScript with Express or Next.js API routes and Prisma ORM or Drizzle ORM for the backend.
- Use PostgreSQL with UTC timestamps, UUIDs and transactional integrity; use WebRTC (LiveKit or custom WebSocket signaling with Socket.io), Redis Pub/Sub and BullMQ job queues; Stripe Connect with the transfer_group escrow model and Razorpay Route with on_hold transfers; Firebase Cloud Messaging (FCM) and Twilio SMS/WhatsApp API.
- Deliver the complete website code structure with clean modular components. Do not represent unconfigured provider integrations or HIPAA compliance as live/verified.

## 2. Implement the relational data model, availability API and appointment hold

- Define PostgreSQL enums `consultation_type` (`in_clinic`, `video`), `appointment_status` (`pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`) and `payment_status` (`unpaid`, `held_in_escrow`, `released`, `refunded`).
- `doctor_profiles`: UUID primary key defaulting to `gen_random_uuid()`; unique, non-null `user_id` UUID; required `full_name` VARCHAR(255), `specialty` VARCHAR(100), and `consultation_fee` NUMERIC(10,2); `slot_duration_minutes` INT default 15; `timezone` VARCHAR(50) default UTC; `created_at` TIMESTAMPTZ default current timestamp.
- `doctor_schedules`: UUID primary key; `doctor_id` references doctor_profiles with `ON DELETE CASCADE`; `day_of_week` constrained 0–6; required `start_time` and `end_time` TIME; `is_active` default true.
- `appointments`: UUID primary key; required `patient_id` UUID; `doctor_id` references doctor_profiles; required consultation type; status default `pending`; payment status default `unpaid`; required `scheduled_start_time` and `scheduled_end_time` TIMESTAMPTZ; `patient_notes` TEXT; `created_at` TIMESTAMPTZ default current timestamp.
- Prevent double booking with a unique index on `(doctor_id, scheduled_start_time)` where status is not `cancelled`.
- Implement `GET /api/v1/doctors/:doctorId/slots?date=YYYY-MM-DD&timezone=Region/City`: fetch doctor_schedules, subtract overlapping appointments and doctor_leaves, chunk working hours into 15-minute grids with a 5-minute break buffer, and return available versus booked slots converted to the client’s local timezone.
- Implement `POST /api/v1/appointments/hold` with a five-minute Redis distributed lock (`SET slot_lock EX 300`) to hold a slot during checkout.

## 3. Build the video consultation room and signaling architecture

- Provide `/consultation/[appointmentId]` with full-duplex WebSocket connections (`wss://`) authenticated by short-lived JWT tokens tied to `appointment_id`.
- Implement signaling handlers for `join_room`, `offer`, `answer` and `ice_candidate`, and interface with STUN/TURN servers (coturn) for NAT traversal and fallback.
- Render Mute Audio, Toggle Camera, Screen Share, Real-time Chat Panel and E-Prescription drawer controls; include video grid, clinical notes and e-prescription experience.

## 4. Implement the Stripe and Razorpay escrow pipelines

- Stripe Connect: charge the patient upfront using PaymentIntent with `transfer_group: "APPT_<id>"`; hold funds in the platform account while status is confirmed; release 80% to the doctor’s connected account with `stripe.transfers.create` when appointment status transitions to completed; trigger automatic refund with `stripe.refunds.create` if the doctor cancels or does not show within 10 minutes.
- Razorpay Route: use `on_hold: 1` transfers on order creation and patch `on_hold: 0` upon call completion.

## 5. Implement scheduled appointment reminders

- Use a BullMQ queue to schedule T−24 Hours SMS and email reminder with a reschedule link.
- At T−1 Hour, send a high-priority push notification to test camera and mic.
- At T−10 Minutes, send urgent FCM Push and SMS containing deep-link `https://app.practo-clone.com/call/<appointment_id>`.

## 6. Structure the requested AWS security and deployment infrastructure

- Specify a Multi-AZ VPC with three-tier isolated subnets: Public ALB, Private App/EKS tasks and Isolated Database Subnet.
- Enforce AWS KMS customer-managed key (CMK, AES-256) encryption for RDS PostgreSQL, S3 buckets and EBS volumes.
- Enable AWS CloudTrail log validation, CloudWatch log retention and AWS WAF rate limiting.

## 7. Deliver the responsive healthcare experience and required pages

- Use an ultra-clean healthcare aesthetic: deep navy `#0F172A`, teal `#0EA5E9`, medical cyan and crisp white; modern glassmorphism panels (`backdrop-blur-md bg-white/70`); subtle ambient gradient backgrounds with slow fluid wave motion; clean floating doctor cards; hover-state micro-animations; responsive layout.
- Landing page: hero section with background ambient gradient motion, doctor search bar, specialty filters and platform metrics.
- Doctor Directory & Booking Page: filters by specialty, fee and ratings; dynamic date/time slot picker; payment drawer.
- Patient & Doctor Dashboard: upcoming appointments, call history, payment status and join buttons.
- Live Telemedicine Room: video grid, WebRTC media controls, side-by-side clinical notes and e-prescription generator.
