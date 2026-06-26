# 🏥 HealthVault — Digital Health Record Management System

A complete, production-ready digital health record system with AI-powered chatbot, QR sharing, and role-based access control.

---

## 📁 Project Structure

```
healthvault/
├── healthvault-backend/
│   ├── src/
│   │   ├── index.js                  ← Express app entry point
│   │   ├── config/
│   │   │   └── supabase.js           ← DB client
│   │   ├── database/
│   │   │   └── schema.sql            ← PostgreSQL schema
│   │   ├── controllers/
│   │   │   ├── auth.controller.js    ← Register/Login/Profile
│   │   │   ├── record.controller.js  ← Upload/Fetch/Delete records
│   │   │   ├── prescription.controller.js
│   │   │   ├── sharing.controller.js ← QR + doctor sharing
│   │   │   ├── chatbot.controller.js ← AI symptom analysis
│   │   │   └── admin.controller.js   ← Admin management
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── record.routes.js
│   │   │   ├── prescription.routes.js
│   │   │   ├── sharing.routes.js
│   │   │   ├── chatbot.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── admin.routes.js
│   │   └── middleware/
│   │       ├── auth.middleware.js    ← JWT + Role guards
│   │       ├── error.middleware.js   ← Global errors + Audit log
│   │       └── upload.middleware.js  ← Multer file config
│   ├── package.json
│   └── .env.example
└── healthvault-frontend/
    ├── src/
    │   ├── api/client.js             ← Axios + all API calls
    │   ├── store/authStore.js        ← Zustand auth state
    │   └── pages/                   ← React pages (see below)
    └── public/index.html            ← Complete demo (single-file)
```

---

## ⚡ Quick Start

### 1. Setup Supabase
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Open **SQL Editor** → Paste contents of `src/database/schema.sql` → Run
3. Go to **Storage** → Create bucket named `medical-records` (make it public)
4. Copy your **Project URL**, **anon key**, and **service role key**

### 2. Backend Setup
```bash
cd healthvault-backend
npm install

# Create your .env file
cp .env.example .env
# Fill in your Supabase credentials + JWT_SECRET

npm run dev   # Starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd healthvault-frontend
npm install
npm start     # Starts on http://localhost:3000
```

---

## 🗄️ Database Schema

```
users
  ├── id (UUID PK)
  ├── email, password_hash, role
  ├── full_name, phone, date_of_birth, gender
  ├── is_active, is_verified
  └── created_at, updated_at

doctor_profiles (1:1 with users)
  ├── user_id → users.id
  ├── license_number, specialization, hospital
  ├── experience_years, bio, consultation_fee
  └── available_hours (JSONB)

patient_profiles (1:1 with users)
  ├── user_id → users.id
  ├── blood_group, allergies[], chronic_conditions[]
  ├── emergency_contact_name, emergency_contact_phone
  └── insurance_provider, insurance_id

medical_records
  ├── id, patient_id → users.id
  ├── uploaded_by → users.id
  ├── title, category, description
  ├── file_url, file_name, file_type, file_size
  ├── extracted_text (OCR), tags[]
  ├── record_date, is_shared
  ├── qr_code, emergency_access
  └── created_at, updated_at

prescriptions
  ├── patient_id, doctor_id → users.id
  ├── diagnosis, symptoms
  ├── medications (JSONB array)
  ├── instructions, follow_up_date
  └── prescribed_at

record_shares (Patient ↔ Doctor sharing)
  ├── record_id → medical_records.id
  ├── patient_id, doctor_id → users.id
  ├── access_type, expires_at, is_active
  └── shared_at

doctor_patient_access
  ├── doctor_id, patient_id → users.id
  ├── status (pending/approved/revoked)
  └── granted_at

chat_history, audit_logs
```

---

## 🔌 API Endpoints

### 🔐 Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register patient or doctor |
| POST | `/login` | No | Login, get JWT |
| GET | `/me` | ✓ | Get logged-in user |
| PUT | `/change-password` | ✓ | Change password |

**POST /api/auth/register**
```json
// Request body:
{
  "email": "patient@test.com",
  "password": "Patient@123",
  "full_name": "Rahul Verma",
  "role": "patient",              // "patient" | "doctor"
  "phone": "+91 98765 43210",
  "blood_group": "O+",            // patient only
  "license_number": "MCI-12345",  // doctor only
  "specialization": "Cardiologist" // doctor only
}

// Response 201:
{
  "message": "Patient registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "email": "...", "role": "patient", "full_name": "..." }
}
```

**POST /api/auth/login**
```json
// Request: { "email": "...", "password": "..." }
// Response: { "token": "...", "user": { ... } }
```

---

### 📄 Records Routes (`/api/records`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/upload` | Patient, Doctor | Upload medical record |
| GET | `/` | Patient | Get my records |
| GET | `/patient/:id` | Doctor, Admin | Get patient records |
| GET | `/:id` | All | Get single record |
| DELETE | `/:id` | Patient, Admin | Delete record |
| GET | `/emergency/:patientId` | All | Emergency access records |

**POST /api/records/upload** (multipart/form-data)
```
file:            (File — PDF, JPG, PNG, max 20MB)
title:           "CBC Blood Report"
category:        "lab_report"   // see categories below
record_date:     "2025-03-15"
description:     "Annual blood test"
emergency_access: "false"

// Categories: lab_report | prescription | imaging | discharge_summary
//             vaccination | surgery_report | consultation | other

// Response 201:
{
  "message": "Medical record uploaded successfully.",
  "record": {
    "id": "uuid",
    "title": "CBC Blood Report",
    "file_url": "https://...",
    "tags": ["blood", "hemoglobin"],  // auto-detected!
    "qr_code": "data:image/png;base64,...",
    ...
  }
}
```

---

### 💊 Prescriptions (`/api/prescriptions`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/` | Doctor | Add prescription |
| GET | `/my` | Patient | Get my prescriptions |
| GET | `/issued` | Doctor | Get prescriptions I issued |
| GET | `/:id` | Both | Get single prescription |

**POST /api/prescriptions**
```json
{
  "patient_id": "uuid",
  "diagnosis": "Seasonal Flu with Bronchitis",
  "symptoms": "Fever, cough, fatigue",
  "medications": [
    {
      "name": "Paracetamol 500mg",
      "dosage": "1 tablet",
      "frequency": "3x daily",
      "duration": "5 days",
      "instructions": "After meals"
    },
    {
      "name": "Amoxicillin 500mg",
      "dosage": "1 capsule",
      "frequency": "2x daily",
      "duration": "7 days",
      "instructions": "With water, complete course"
    }
  ],
  "instructions": "Rest, drink warm fluids, monitor temperature",
  "follow_up_date": "2025-03-22"
}
```

---

### 🔗 Sharing (`/api/sharing`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/share-record` | Patient | Share record with doctor |
| DELETE | `/revoke/:shareId` | Patient | Revoke share |
| GET | `/my-shares` | Patient | List all my shares |
| POST | `/request-access` | Doctor | Request patient access |
| PUT | `/access/:id` | Patient | Approve/revoke access |
| GET | `/access-requests` | Both | View access requests |
| GET | `/qr/:recordId` | Patient | Get QR code for record |

---

### 🤖 Chatbot (`/api/chatbot`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/message` | Optional | Send symptom message |
| GET | `/history` | ✓ | Get chat history |
| GET | `/sessions` | ✓ | Get past sessions |

**POST /api/chatbot/message**
```json
// Request:
{ "message": "I have a fever and headache for 2 days", "session_id": "optional-uuid" }

// Response:
{
  "response": "**Possible Causes:**\n• Viral infections...\n\n**General Advice:**\n...",
  "session_id": "uuid",
  "has_emergency": false,
  "matched_conditions": [
    { "condition": "fever", "severity": "moderate" },
    { "condition": "headache", "severity": "low" }
  ]
}
```

---

### 👑 Admin (`/api/admin`) — Admin role only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| PUT | `/verify-doctor/:id` | Approve/reject doctor |
| PUT | `/toggle-user/:id` | Activate/deactivate user |
| GET | `/stats` | Dashboard statistics |
| GET | `/audit-logs` | System audit trail |

---

## 🔒 Security Architecture

```
1. Password Hashing: bcrypt with salt rounds 12
2. JWT: HS256, 7-day expiry, stored in localStorage
3. Rate Limiting: 100 req/15min general, 10 req/15min auth
4. Role Guards: middleware/auth.middleware.js
   - authenticate: verifies JWT
   - authorize(...roles): role-based access
   - requireVerified: doctor must be admin-approved
5. Helmet: sets secure HTTP headers
6. CORS: restricted to frontend origin
7. Audit Logs: every sensitive action logged with user, IP, timestamp
```

---

## 🚀 Bonus Features

### QR Code Sharing
- Every uploaded record gets a QR code auto-generated
- Patient can share QR → doctor scans → temporary access granted
- QR expires in 7 days

### Emergency Access Mode
- Patient marks records as `emergency_access: true`
- `/api/records/emergency/:patientId` — publicly accessible
- Shows: blood group, allergies, emergency contacts, flagged records

### Smart Auto-Tagging
- On upload, system analyzes title + description
- Auto-detects: blood, cardiac, radiology, diabetes, liver, kidney, thyroid, covid, vaccination
- Tags are searchable and filterable

### AI Chatbot
- Rule-based keyword matching across 8 medical categories
- Severity levels: low / moderate / high / emergency
- Emergency auto-escalation with 112 notice
- Full safety disclaimer on every response
- Optionally: extend with OpenAI API for richer responses

---

## 🧪 Testing the API

```bash
# 1. Register a patient
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234","full_name":"Test User","role":"patient"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'
# → copy the token

# 3. Upload a record
curl -X POST http://localhost:5000/api/records/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/report.pdf" \
  -F "title=Blood Report" \
  -F "category=lab_report" \
  -F "record_date=2025-03-15"

# 4. Chat with AI
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"I have a high fever and headache"}'
```

---

## 🛡️ Default Admin Credentials
```
Email:    admin@healthvault.com
Password: Admin@123 (CHANGE IMMEDIATELY IN PRODUCTION)
```

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Zustand, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL via Supabase |
| File Storage | Supabase Storage |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer (memory storage) |
| QR Codes | qrcode npm package |
| Rate Limiting | express-rate-limit |
| Security | Helmet, CORS, bcrypt rounds 12 |
| Validation | validator.js |

---

*Built for hackathon — HealthVault v1.0.0*
