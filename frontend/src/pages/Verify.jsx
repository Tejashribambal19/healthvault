// src/pages/Verify.jsx — Admin: approve/reject doctors via PUT /api/admin/verify-doctor/:id
import React, { useEffect, useState } from 'react'
import { adminAPI } from '../services/api'
import Badge from '../components/ui/Badge'

export default function Verify() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminAPI.users({ role: 'doctor', is_verified: 'false' })
      setDoctors(res.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleAction = async (id, action, name) => {
    try {
      await adminAPI.verifyDoctor(id, action)
      setDoctors((prev) => prev.filter((d) => d.id !== id))
      showToast(action === 'approve' ? `${name} approved.` : `${name} rejected.`, action === 'approve' ? 'success' : 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: toast.type === 'success' ? 'var(--accent-light)' : 'var(--red-light)',
          border: `1px solid ${toast.type === 'success' ? 'var(--accent)' : 'var(--red)'}`,
          color: toast.type === 'success' ? 'var(--accent)' : 'var(--red)',
          borderRadius: 'var(--radius)', padding: '12px 20px', fontSize: 13.5, fontWeight: 500,
          boxShadow: 'var(--shadow2)',
        }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <div className="section-header">
        <div>
          <div className="section-title">Doctor Verification</div>
          <div className="section-sub">Live pending doctors from /api/admin/users?role=doctor&is_verified=false</div>
        </div>
        <Badge variant="amber">{doctors.length} pending</Badge>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>⚠️ {error}</div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32 }}>✅</div>
            <div style={{ fontSize: 13.5 }}>No pending doctor verifications</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Doctor</th><th>Email</th><th>Submitted</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 500 }}>{d.full_name}</td>
                    <td style={{ color: 'var(--text2)' }}>{d.email}</td>
                    <td style={{ fontSize: 13, color: 'var(--text3)' }}>{d.created_at?.split('T')[0]}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="verify-btn approve" onClick={() => handleAction(d.id, 'approve', d.full_name)}>✓ Approve</button>
                        <button className="verify-btn reject" onClick={() => handleAction(d.id, 'reject', d.full_name)}>✕ Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
