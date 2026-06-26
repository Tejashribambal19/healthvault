// src/pages/Patients.jsx — Doctor: live list from GET /api/users/my-patients
import React, { useEffect, useState } from 'react'
import { usersAPI, recordsAPI } from '../services/api'

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    usersAPI.myPatients()
      .then((res) => setPatients(res.patients || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const openPatient = async (entry) => {
    setSelected(entry)
    setRecords([])
    try {
      const res = await recordsAPI.patientRecords(entry.patient.id)
      setRecords(res.records || [])
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">My Patients</div>
          <div className="section-sub">Patients who approved your access request</div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>⚠️ {error}</div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Approved Patients</div>
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              No approved patients yet. Send an access request from the Sharing tab to get started.
            </div>
          ) : (
            patients.map((p, i) => (
              <div key={i} className="patient-row" onClick={() => openPatient(p)}>
                <div className="avatar avatar-green">
                  {p.patient.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.patient.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {p.patient.patient_profiles?.blood_group || '—'} ·{' '}
                    {(p.patient.patient_profiles?.chronic_conditions || []).join(', ') || 'No chronic conditions'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          {selected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid var(--border2)', marginBottom: 16 }}>
                <div className="avatar avatar-green" style={{ width: 48, height: 48, fontSize: 16 }}>
                  {selected.patient.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{selected.patient.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{selected.patient.email}</div>
                </div>
              </div>
              <div className="card-title" style={{ marginBottom: 12 }}>Shared Records</div>
              {records.length === 0 ? (
                <div className="empty-state">No records shared yet</div>
              ) : (
                records.map((r) => (
                  <div key={r.id} className="record-item">
                    <div className="record-icon pdf">DOC</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>{r.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.record_date}</div>
                    </div>
                    <a className="btn btn-secondary btn-sm" href={r.file_url} target="_blank" rel="noreferrer">View</a>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="empty-state">Select a patient to view their shared records</div>
          )}
        </div>
      </div>
    </>
  )
}
