CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE consultation_type AS ENUM ('in_clinic', 'video');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('unpaid', 'held_in_escrow', 'released', 'refunded');

CREATE TABLE doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  consultation_fee NUMERIC(10, 2) NOT NULL CHECK (consultation_fee >= 0),
  slot_duration_minutes INT NOT NULL DEFAULT 15 CHECK (slot_duration_minutes > 0),
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX doctor_profiles_specialty_idx ON doctor_profiles (specialty);

CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (start_time < end_time)
);
CREATE INDEX doctor_schedules_doctor_day_active_idx ON doctor_schedules (doctor_id, day_of_week, is_active);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  type consultation_type NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  scheduled_end_time TIMESTAMPTZ NOT NULL,
  patient_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (scheduled_start_time < scheduled_end_time)
);
CREATE INDEX appointments_patient_start_idx ON appointments (patient_id, scheduled_start_time);
CREATE INDEX appointments_doctor_start_idx ON appointments (doctor_id, scheduled_start_time);
CREATE INDEX appointments_status_start_idx ON appointments (status, scheduled_start_time);
CREATE UNIQUE INDEX prevent_double_booking
  ON appointments (doctor_id, scheduled_start_time)
  WHERE status NOT IN ('cancelled');

CREATE TABLE doctor_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (starts_at < ends_at)
);
CREATE INDEX doctor_leaves_doctor_range_active_idx ON doctor_leaves (doctor_id, starts_at, ends_at, is_active);
