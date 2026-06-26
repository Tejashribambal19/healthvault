// src/pages/Share.jsx — Patient: real sharing + access-request workflow
// POST /api/sharing/share-record, GET /api/sharing/my-shares,
// GET /api/sharing/access-requests, PUT /api/sharing/access/:id
import React, { useEffect, useState } from 'react'
import { sharingAPI, recordsAPI, usersAPI } from '../services/api'
import { ShareIcon } from '../components/ui/Icons'

export default function Share() {
  const [records, setRecords] = useState([])
  const [doctors, setDoctors] = useState([])
  const [shares, setShares] = useState([])
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [selectedRecord, setSelectedRecord] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [qr, setQr] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadAll = async () => {
    try {
      const [recRes, docRes, shareRes, reqRes] = await Promise.all([
        recordsAPI.myRecords(),
        usersAPI.doctors(),
        sharingAPI.myShares(),
        sharingAPI.accessRequests(),
      ])
      setRecords(recRes.records || [])
      setDoctors(docRes.doctors || [])
      setShares(shareRes.shares || [])
      setRequests(reqRes.requests || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { loadAll() }, [])

  const handleShare = async (e) => {
    e.preventDefault()
    if (!selectedRecord || !selectedDoctor) return
    try {
      await sharingAPI.shareRecord({ record_id: selectedRecord, doctor_id: selectedDoctor })
      showToast('Record shared successfully.')
      loadAll()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleRevoke = async (shareId) => {
    try {
      await sharingAPI.revoke(shareId)
      showToast('Access revoked.')
      loadAll()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleRequestAction = async (id, action) => {
    try {
      await sharingAPI.resolveAccess(id, action)
      showToast(action === 'approve' ? 'Access granted.' : 'Request declined.')
      loadAll()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleGetQR = async () => {
    if (!selectedRecord) return
    try {
      const res = await sharingAPI.getQR(selectedRecord)
      setQr(res)
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
        }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <div className="section-header">
        <div>
          <div className="section-title">Share Records</div>
          <div className="section-sub">Real access-control workflow via the backend</div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>⚠️ {error}</div>
        </div>
      )}

      <div className="grid-2">
        {/* Share form */}
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18 }}>Share a Record with a Doctor</div>
          <form onSubmit={handleShare}>
            <div className="form-group">
              <label className="form-label">Record</label>
              <select className="form-input" value={selectedRecord} onChange={(e) => setSelectedRecord(e.target.value)} required>
                <option value="">Select a record</option>
                {records.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Doctor (must be verified)</label>
              <select className="form-input" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required>
                <option value="">Select a doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} — {d.doctor_profiles?.specialization}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary btn-full" style={{ padding: 11 }}>
              <ShareIcon size={14} /> Share Record
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Active Shares</div>
            {shares.length === 0 ? (
              <div className="empty-state">No active shares yet</div>
            ) : (
              shares.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border2)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{s.record?.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
                      → {s.doctor?.full_name} ({s.doctor?.doctor_profiles?.specialization})
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleRevoke(s.id)}>Revoke</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* QR + pending requests */}
        <div>
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>QR Code Sharing</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
              Select a record on the left, then generate its real QR code
            </div>
            <button className="btn btn-secondary" onClick={handleGetQR} disabled={!selectedRecord}>
              Generate QR for Selected Record
            </button>
            {qr && (
              <div style={{ marginTop: 16 }}>
                <img src={qr.qr_code} alt="QR code" style={{ width: 180, height: 180, borderRadius: 8 }} />
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>{qr.record_title}</div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Pending Access Requests</div>
            {requests.length === 0 ? (
              <div className="empty-state">No pending requests</div>
            ) : (
              requests.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border2)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{r.doctor?.full_name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{r.doctor?.doctor_profiles?.specialization}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="verify-btn approve" onClick={() => handleRequestAction(r.id, 'approve')}>Approve</button>
                    <button className="verify-btn reject" onClick={() => handleRequestAction(r.id, 'revoke')}>Decline</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
