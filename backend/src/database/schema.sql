-- ============================================================
-- HealthVault - Complete PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS TABLE ─────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  date_of_birth DATE,
  gender        VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  address       TEXT,
  profile_pic   TEXT,                    -- Supabase storage URL
  is_active     BOOLEAN DEFAULT TRUE,
  is_verified   BOOLEAN DEFAULT FALSE,   -- For doctors: admin verifies
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DOCTOR PROFILES ─────────────────────────────────────────
CREATE TABLE doctor_profiles (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number    VARCHAR(100) UNIQUE NOT NULL,
  specialization    VARCHAR(255) NOT NULL,
  hospital          VARCHAR(255),
  experience_years  INTEGER,
  qualification     TEXT,
  bio               TEXT,
  consultation_fee  DECIMAL(10,2),
  available_hours   JSONB,              -- {"mon": "9-5", "tue": "9-5"}
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── PATIENT PROFILES ────────────────────────────────────────
CREATE TABLE patient_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blood_group     VARCHAR(5) CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  allergies       TEXT[],              -- Array of allergy strings
  chronic_conditions TEXT[],
  emergency_contact_name  VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  insurance_provider      VARCHAR(255),
  insurance_id            VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── MEDICAL RECORDS ─────────────────────────────────────────
CREATE TABLE medical_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES users(id),   -- patient or doctor
  title           VARCHAR(255) NOT NULL,
  category        VARCHAR(50) NOT NULL CHECK (category IN (
                    'lab_report', 'prescription', 'imaging', 'discharge_summary',
                    'vaccination', 'surgery_report', 'consultation', 'other'
                  )),
  description     TEXT,
  file_url        TEXT NOT NULL,          -- Supabase storage URL
  file_name       TEXT NOT NULL,
  file_type       VARCHAR(50),            -- 'application/pdf', 'image/jpeg', etc.
  file_size       INTEGER,                -- in bytes
  extracted_text  TEXT,                   -- OCR result
  tags            TEXT[],                 -- Smart categorization tags
  record_date     DATE NOT NULL,
  is_shared       BOOLEAN DEFAULT FALSE,
  qr_code         TEXT,                   -- QR code data URL for sharing
  emergency_access BOOLEAN DEFAULT FALSE, -- Visible in emergency mode
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PRESCRIPTIONS ───────────────────────────────────────────
CREATE TABLE prescriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id     UUID NOT NULL REFERENCES users(id),
  record_id     UUID REFERENCES medical_records(id) ON DELETE SET NULL,
  diagnosis     TEXT NOT NULL,
  symptoms      TEXT,
  medications   JSONB NOT NULL,    -- [{name, dosage, frequency, duration, instructions}]
  instructions  TEXT,
  follow_up_date DATE,
  is_active     BOOLEAN DEFAULT TRUE,
  prescribed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RECORD SHARING (Patient ↔ Doctor) ───────────────────────
CREATE TABLE record_shares (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id   UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES users(id),
  doctor_id   UUID NOT NULL REFERENCES users(id),
  access_type VARCHAR(20) DEFAULT 'read' CHECK (access_type IN ('read', 'comment')),
  expires_at  TIMESTAMPTZ,              -- NULL = no expiry
  is_active   BOOLEAN DEFAULT TRUE,
  shared_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(record_id, doctor_id)
);

-- ─── DOCTOR-PATIENT RELATIONSHIPS ────────────────────────────
CREATE TABLE doctor_patient_access (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by  UUID REFERENCES users(id),   -- who approved
  status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','revoked')),
  granted_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, patient_id)
);

-- ─── CHAT HISTORY (AI Chatbot) ────────────────────────────────
CREATE TABLE chat_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL DEFAULT uuid_generate_v4(),
  role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  message     TEXT NOT NULL,
  metadata    JSONB,              -- {symptoms, advice_given, etc.}
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIT LOGS ───────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,   -- 'view_record', 'upload_record', etc.
  resource    VARCHAR(100),
  resource_id UUID,
  ip_address  INET,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES FOR PERFORMANCE ──────────────────────────────────
CREATE INDEX idx_users_email       ON users(email);
CREATE INDEX idx_users_role        ON users(role);
CREATE INDEX idx_records_patient   ON medical_records(patient_id);
CREATE INDEX idx_records_category  ON medical_records(category);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor  ON prescriptions(doctor_id);
CREATE INDEX idx_shares_doctor     ON record_shares(doctor_id);
CREATE INDEX idx_shares_record     ON record_shares(record_id);
CREATE INDEX idx_audit_user        ON audit_logs(user_id);
CREATE INDEX idx_chat_user         ON chat_history(user_id);
CREATE INDEX idx_chat_session      ON chat_history(session_id);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── DEFAULT ADMIN SEED ───────────────────────────────────────
-- Password: Admin@123 (change immediately in production!)
INSERT INTO users (email, password_hash, role, full_name, is_verified) VALUES
  ('admin@healthvault.com',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgx8n1LGv9k.JXzqE2qXqK',
   'admin', 'System Administrator', TRUE);

-- ─── SAMPLE DATA (Optional for development) ──────────────────
/*
INSERT INTO users (email, password_hash, role, full_name, is_verified) VALUES
  ('doctor@test.com', '<hashed>', 'doctor', 'Dr. Priya Sharma', TRUE),
  ('patient@test.com', '<hashed>', 'patient', 'Rahul Verma', FALSE);
*/
