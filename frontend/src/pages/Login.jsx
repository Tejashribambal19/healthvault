// src/pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CheckIcon, ArrowRightIcon } from '../components/ui/Icons'

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Orthopedics', 'Pediatrics', 'Gynecologist', 'Psychiatrist', 'ENT Specialist',
]

export default function Login() {
  const { login, register, loading, authError } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [role, setRole] = useState('patient')
  const [localError, setLocalError] = useState('')

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    license_number: '', specialization: '', hospital: '',
    blood_group: '',
  })

  // ── LOGIN submit — calls real backend ───────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setLocalError('')
    try {
      await login(loginForm)
      navigate('/')
    } catch (err) {
      setLocalError(err.message)
    }
  }

  // ── REGISTER submit — calls real backend ────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    setLocalError('')
    try {
      await register({ ...regForm, role })
      navigate('/')
    } catch (err) {
      setLocalError(err.message)
    }
  }

  const FEATURES = [
    '256-bit encrypted record storage',
    'QR code one-scan sharing',
    'AI-powered symptom guidance',
    'Role-based access control',
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left panel */}
      <div style={{
        flex: 1, background: 'var(--accent)', padding: '48px 52px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon size={18} style={{ color: 'white' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'white' }}>HealthVault</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
            Your health<br /><em>history,</em><br />always with you.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.7, maxWidth: 340 }}>
            Securely store, manage, and share your medical records — connected to a real Express + PostgreSQL backend.
          </p>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FEATURES.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckIcon size={10} style={{ color: 'white' }} />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius)',
          padding: 16, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7,
        }}>
          <strong>For developers:</strong> This UI talks to a real backend at <code>VITE_API_URL</code>
          {' '}(default <code>http://localhost:5000/api</code>). Start the backend first, then register a
          new patient or doctor below.
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: 13.5, marginBottom: 24 }}>
            {mode === 'login' ? 'Sign in to your health portal' : 'Join HealthVault as a patient or doctor'}
          </p>

          {/* mode switch */}
          <div className="role-switcher" style={{ marginBottom: 16 }}>
            <button className={`role-opt ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
            <button className={`role-opt ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Register</button>
          </div>

          {(localError || authError) && (
            <div style={{
              background: 'var(--red-light)', color: 'var(--red)', borderRadius: 'var(--radius2)',
              padding: '10px 14px', fontSize: 12.5, marginBottom: 14,
            }}>
              {localError || authError}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="form-input" type="email" placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  required />
              </div>
              <button className="btn btn-primary btn-full" type="submit" style={{ padding: 11, fontSize: 14 }} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in to HealthVault'}
                {!loading && <ArrowRightIcon size={16} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="role-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <button type="button"
                  className={`role-opt ${role === 'patient' ? 'active' : ''}`}
                  style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}
                  onClick={() => setRole('patient')}>
                  🧑‍⚕️ Patient
                </button>
                <button type="button"
                  className={`role-opt ${role === 'doctor' ? 'active' : ''}`}
                  style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}
                  onClick={() => setRole('doctor')}>
                  👨‍⚕️ Doctor
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={regForm.full_name}
                  onChange={(e) => setRegForm((p) => ({ ...p, full_name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={regForm.email}
                  onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password (min 8 characters)</label>
                <input className="form-input" type="password" minLength={8} value={regForm.password}
                  onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={regForm.phone}
                  onChange={(e) => setRegForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>

              {role === 'doctor' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Medical License Number</label>
                    <input className="form-input" value={regForm.license_number}
                      onChange={(e) => setRegForm((p) => ({ ...p, license_number: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <select className="form-input" value={regForm.specialization}
                      onChange={(e) => setRegForm((p) => ({ ...p, specialization: e.target.value }))} required>
                      <option value="">Select specialization</option>
                      {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ background: 'var(--amber-light)', borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--amber)', marginBottom: 14 }}>
                    ⚠️ Doctor accounts require admin verification before they're active.
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="form-label">Blood Group (optional)</label>
                  <select className="form-input" value={regForm.blood_group}
                    onChange={(e) => setRegForm((p) => ({ ...p, blood_group: e.target.value }))}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              )}

              <button className="btn btn-primary btn-full" type="submit" style={{ padding: 11, fontSize: 14 }} disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text3)', marginTop: 18 }}>
            Backend not running? Start it with <code>npm run dev</code> inside <code>/backend</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
