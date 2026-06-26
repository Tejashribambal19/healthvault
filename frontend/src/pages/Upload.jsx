// src/pages/Upload.jsx
//
// Uploads a real file to POST /api/records/upload (multipart/form-data)
import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordsAPI } from '../services/api'
import { UploadIcon } from '../components/ui/Icons'

const CATEGORIES = [
  { value: 'lab_report',        label: 'Lab Report'        },
  { value: 'imaging',           label: 'Imaging / X-Ray / MRI' },
  { value: 'prescription',      label: 'Prescription'      },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'vaccination',       label: 'Vaccination Record' },
  { value: 'surgery_report',    label: 'Surgery Report'    },
  { value: 'consultation',      label: 'Consultation'      },
  { value: 'other',             label: 'Other'             },
]

export default function Upload() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [dragging, setDragging] = useState(false)
  const [file, setFile]         = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const [form, setForm] = useState({
    title: '', category: 'lab_report',
    record_date: new Date().toISOString().split('T')[0],
    description: '', emergency_access: false,
  })

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    if (!form.title) setForm((p) => ({ ...p, title: f.name.replace(/\.[^/.]+$/, '') }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  // ── Real upload to backend ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) { setError('Please select a file to upload.'); return }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', form.title)
    fd.append('category', form.category)
    fd.append('record_date', form.record_date)
    fd.append('description', form.description)
    fd.append('emergency_access', form.emergency_access)

    setUploading(true)
    try {
      await recordsAPI.upload(fd)
      setSuccess(true)
      setTimeout(() => navigate('/records'), 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (success) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 480, margin: '40px auto' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 6 }}>Record uploaded!</div>
        <div style={{ color: 'var(--text2)', fontSize: 13.5 }}>Redirecting to your records…</div>
      </div>
    )
  }

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Upload Record</div>
          <div className="section-sub">Sends a real multipart request to the backend → Supabase Storage</div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>⚠️ {error}</div>
        </div>
      )}

      <div className="grid-2">
        <div>
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            <div className="upload-zone-icon"><UploadIcon size={24} /></div>
            {file ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--accent)' }}>{file.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Drop files here, or click to browse</div>
                <div style={{ fontSize: 12.5, color: 'var(--text3)' }}>PDF, JPG, PNG, WEBP — max 20 MB</div>
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">What happens on submit</div>
            {[
              '1️⃣ File sent as multipart/form-data to POST /api/records/upload',
              '2️⃣ Backend (Multer) validates type + size, then uploads to Supabase Storage',
              '3️⃣ A row is inserted into the medical_records table with the returned file URL',
              '4️⃣ Title/description are auto-scanned to generate searchable tags',
            ].map((s, i) => (
              <div key={i} style={{ fontSize: 12.5, color: 'var(--text2)', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border2)' : 'none' }}>{s}</div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 18 }}>Record Details</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="e.g. CBC Blood Test — March 2026"
                value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-input" value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date of Report *</label>
              <input className="form-input" type="date" value={form.record_date}
                onChange={(e) => setForm((p) => ({ ...p, record_date: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea className="form-input" placeholder="Any additional context…"
                value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="emergency" checked={form.emergency_access}
                onChange={(e) => setForm((p) => ({ ...p, emergency_access: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--red)' }} />
              <label htmlFor="emergency" style={{ fontSize: 13, cursor: 'pointer' }}>
                🚨 Make visible in Emergency Access mode
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" style={{ flex: 1, justifyContent: 'center' }} disabled={uploading}>
                <UploadIcon size={14} /> {uploading ? 'Uploading…' : 'Upload Record'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/records')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
