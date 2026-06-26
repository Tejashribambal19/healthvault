// src/pages/Oversight.jsx
//
// ADMIN ONLY. This is the "main admin can see everything" page.
// Unlike Patients.jsx (doctor) or Records.jsx (patient), this page
// calls /api/admin/patients/:id and /api/admin/doctors/:id, which
// bypass the normal sharing/access-grant rules — the admin sees
// every record, every prescription, every access grant, for anyone.
import React, { useEffect, useState } from 'react'
import { adminAPI } from '../services/api'
import Badge from '../components/ui/Badge'

export default function Oversight() {
  const [tab, setTab] = useState('patients') // 'patients' | 'doctors'
  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadList = async () => {
    setLoading(true)
    setError('')
    setSelected(null)
    setDetail(null)
    try {
      const res = await adminAPI.users({ role: tab === 'patients' ? 'patient' : 'doctor' })
      setList(res.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadList() }, [tab])

  const openDetail = async (user) => {
    setSelected(user)
    setDetail(null)
    try {
      const res = tab === 'patients'
        ? await adminAPI.patientOverview(user.id)
        : await adminAPI.doctorOverview(user.id)
      setDetail(res)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Full Oversight</div>
          <div className="section-sub">
            Admin-only view of every patient's and doctor's data — bypasses normal sharing rules
          </div>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${tab === 'patients' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('patients')}>
          Patients
        </button>
        <button className={`btn btn-sm ${tab === 'doctors' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('doctors')}>
          Doctors
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>⚠️ {error}</div>
        </div>
      )}

      <div className="grid-2">
        {/* List */}
        <div className="card">
          <div className="card-title">{tab === 'patients' ? 'All Patients' : 'All Doctors'}</div>
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : list.length === 0 ? (
            <div className="empty-state">No {tab} found</div>
          ) : (
            list.map((u) => (
              <div key={u.id} className="patient-row" onClick={() => openDetail(u)}
                style={selected?.id === u.id ? { background: 'var(--accent-light)', borderRadius: 8 } : {}}>
                <div className={`avatar ${tab === 'patients' ? 'avatar-green' : 'avatar-blue'}`}>
                  {u.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>{u.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.email}</div>
                </div>
                {tab === 'doctors' && (
                  <Badge variant={u.is_verified ? 'green' : 'amber'}>{u.is_verified ? 'Verified' : 'Pending'}</Badge>
                )}
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="card">
          {!selected ? (
            <div className="empty-state">Select a {tab === 'patients' ? 'patient' : 'doctor'} to view full data</div>
          ) : !detail ? (
            <div className="empty-state">Loading details…</div>
          ) : tab === 'patients' ? (
            <PatientDetail detail={detail} />
          ) : (
            <DoctorDetail detail={detail} />
          )}
        </div>
      </div>
    </>
  )
}

function PatientDetail({ detail }) {
  const { patient, records, prescriptions, shares } = detail
  const profile = patient.patient_profiles?.[0] || patient.patient_profiles || {}
  return (
    <>
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border2)', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{patient.full_name}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{patient.email}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
          Blood group: {profile.blood_group || '—'} · Allergies: {(profile.allergies || []).join(', ') || 'None'}
        </div>
      </div>

      <div className="card-title" style={{ marginBottom: 10 }}>
        All Records <Badge variant="gray">{records?.length || 0}</Badge>
      </div>
      {(records || []).map((r) => (
        <div key={r.id} className="record-item">
          <div className="record-icon pdf">DOC</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 13.5 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{r.category?.replace(/_/g, ' ')} · {r.record_date}</div>
          </div>
          <a className="btn btn-secondary btn-sm" href={r.file_url} target="_blank" rel="noreferrer">View</a>
        </div>
      ))}

      <div className="card-title" style={{ marginTop: 16, marginBottom: 10 }}>
        All Prescriptions <Badge variant="gray">{prescriptions?.length || 0}</Badge>
      </div>
      {(prescriptions || []).map((p) => (
        <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.diagnosis}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            by {p.doctor?.full_name} ({p.doctor?.doctor_profiles?.specialization}) · {p.prescribed_at?.split('T')[0]}
          </div>
        </div>
      ))}

      <div className="card-title" style={{ marginTop: 16, marginBottom: 10 }}>
        Doctors With Access <Badge variant="gray">{shares?.length || 0}</Badge>
      </div>
      {(shares || []).map((s) => (
        <div key={s.id} style={{ fontSize: 13, padding: '6px 0' }}>
          🔗 {s.doctor?.full_name} — {s.is_active ? <Badge variant="green">Active</Badge> : <Badge variant="gray">Revoked</Badge>}
        </div>
      ))}
    </>
  )
}

function DoctorDetail({ detail }) {
  const { doctor, prescriptions, patients } = detail
  const profile = doctor.doctor_profiles?.[0] || doctor.doctor_profiles || {}
  return (
    <>
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border2)', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{doctor.full_name}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{doctor.email}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
          {profile.specialization} · {profile.hospital} · License: {profile.license_number}
        </div>
      </div>

      <div className="card-title" style={{ marginBottom: 10 }}>
        Approved Patients <Badge variant="gray">{patients?.length || 0}</Badge>
      </div>
      {(patients || []).map((p) => (
        <div key={p.id} style={{ fontSize: 13, padding: '6px 0' }}>👤 {p.patient?.full_name} ({p.patient?.email})</div>
      ))}

      <div className="card-title" style={{ marginTop: 16, marginBottom: 10 }}>
        Prescriptions Issued <Badge variant="gray">{prescriptions?.length || 0}</Badge>
      </div>
      {(prescriptions || []).map((p) => (
        <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
          <div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.diagnosis}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            for {p.patient?.full_name} · {p.prescribed_at?.split('T')[0]}
          </div>
        </div>
      ))}
    </>
  )
}
