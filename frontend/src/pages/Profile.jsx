// src/pages/Profile.jsx — loads live profile via GET /api/auth/me,
// saves changes via PUT /api/users/profile
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI, usersAPI } from '../services/api'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export default function Profile() {
  const { user, currentRole, updateUser } = useAuth()
  const [form, setForm] = useState({
    full_name: '', phone: '', date_of_birth: '', gender: '', address: '',
    blood_group: '', specialization: '', hospital: '',
  })
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    authAPI.me()
      .then((res) => {
        const u = res.user
        setForm({
          full_name: u.full_name || '',
          phone: u.phone || '',
          date_of_birth: u.date_of_birth || '',
          gender: u.gender || '',
          address: u.address || '',
          blood_group: u.patient_profiles?.[0]?.blood_group || '',
          specialization: u.doctor_profiles?.[0]?.specialization || '',
          hospital: u.doctor_profiles?.[0]?.hospital || '',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await usersAPI.updateProfile(form)
      updateUser(res.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    }
  }

  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const avatarColors = { patient: 'avatar-green', doctor: 'avatar-blue', admin: 'avatar-orange' }

  return (
    <>
      <div className="section-header"><div className="section-title">My Profile</div></div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>⚠️ {error}</div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <div className={`avatar ${avatarColors[currentRole]}`} style={{ width: 68, height: 68, fontSize: 22, margin: '0 auto 12px' }}>
              {initials}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500 }}>{form.full_name || user?.full_name}</div>
            <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{user?.email}</div>
          </div>

          {loading ? (
            <div className="empty-state">Loading profile…</div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date" value={form.date_of_birth || ''} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </div>

              {currentRole === 'patient' && (
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-input" value={form.blood_group} onChange={(e) => setForm((p) => ({ ...p, blood_group: e.target.value }))}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              )}
              {currentRole === 'doctor' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input className="form-input" value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hospital</label>
                    <input className="form-input" value={form.hospital} onChange={(e) => setForm((p) => ({ ...p, hospital: e.target.value }))} />
                  </div>
                </>
              )}

              <button className="btn btn-primary" type="submit">{saved ? '✓ Saved!' : 'Save Changes'}</button>
            </form>
          )}
        </div>

        <div className="card">
          <div className="card-title">Account Info</div>
          {[
            { label: 'Account Type', value: currentRole },
            { label: 'Verified', value: user?.is_verified ? 'Yes' : 'Pending' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border2)' }}>
              <span style={{ fontSize: 13.5, color: 'var(--text2)' }}>{item.label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
