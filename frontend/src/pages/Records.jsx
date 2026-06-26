// src/pages/Records.jsx
//
// Patient's record list — fetched LIVE from GET /api/records
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recordsAPI } from '../services/api'
import { PlusIcon } from '../components/ui/Icons'

const CATEGORIES = [
  { value: '',                  label: 'All types'         },
  { value: 'lab_report',        label: 'Lab Report'        },
  { value: 'imaging',           label: 'Imaging'           },
  { value: 'prescription',      label: 'Prescription'      },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'vaccination',       label: 'Vaccination'       },
  { value: 'surgery_report',    label: 'Surgery Report'    },
  { value: 'consultation',      label: 'Consultation'      },
  { value: 'other',             label: 'Other'             },
]

function iconFor(fileType = '') {
  if (fileType.includes('pdf')) return { type: 'PDF', cls: 'pdf' }
  if (fileType.includes('image')) return { type: 'IMG', cls: 'img' }
  return { type: 'DOC', cls: 'rx' }
}

export default function Records() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await recordsAPI.myRecords(filter ? { category: filter } : {})
      setRecords(res.records || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecords() }, [filter])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record permanently?')) return
    try {
      await recordsAPI.remove(id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">My Records</div>
          <div className="section-sub">
            {loading ? 'Loading…' : `${records.length} record(s) — live from backend`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-input" style={{ width: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            <PlusIcon size={14} /> Upload
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>
            ⚠️ {error} — make sure the backend is running at the URL set in <code>VITE_API_URL</code>.
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="spinner" /> Loading records…</div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32 }}>📂</div>
            <div style={{ fontSize: 13.5 }}>No records yet — upload your first one</div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/upload')}>
              <PlusIcon size={12} /> Upload Record
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Record</th><th>Category</th><th>Date</th><th>Size</th><th>Shared</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const icon = iconFor(r.file_type)
                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className={`record-icon ${icon.cls}`}>{icon.type}</div>
                          <div style={{ fontWeight: 500 }}>{r.title}</div>
                        </div>
                      </td>
                      <td>{r.category?.replace(/_/g, ' ')}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{r.record_date}</td>
                      <td style={{ color: 'var(--text3)', fontSize: 12.5 }}>
                        {r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${r.is_shared ? 'badge-green' : 'badge-gray'}`}>
                          {r.is_shared ? 'Shared' : 'Private'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <a className="btn btn-secondary btn-sm" href={r.file_url} target="_blank" rel="noreferrer">View</a>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
