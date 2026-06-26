// src/pages/Prescriptions.jsx
// Doctor → POST /api/prescriptions, GET /api/prescriptions/issued
// Patient → GET /api/prescriptions/my
import React, { useEffect, useState } from 'react'
import { prescriptionsAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

export default function Prescriptions() {
  const { currentRole } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [patients, setPatients] = useState([])

  const [form, setForm] = useState({
    patient_id: '', diagnosis: '', symptoms: '',
    medName: '', dosage: '', frequency: '', duration: '',
    instructions: '', follow_up_date: '',
  })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = currentRole === 'doctor'
        ? await prescriptionsAPI.issuedList()
        : await prescriptionsAPI.myList()
      setList(res.prescriptions || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [currentRole])

  useEffect(() => {
    if (currentRole === 'doctor' && showModal) {
      usersAPI.myPatients().then((res) => setPatients(res.patients || [])).catch(() => {})
    }
  }, [showModal, currentRole])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await prescriptionsAPI.create({
        patient_id: form.patient_id,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms,
        medications: [{
          name: form.medName, dosage: form.dosage,
          frequency: form.frequency, duration: form.duration,
          instructions: form.instructions,
        }],
        follow_up_date: form.follow_up_date || null,
      })
      setShowModal(false)
      setForm({ patient_id: '', diagnosis: '', symptoms: '', medName: '', dosage: '', frequency: '', duration: '', instructions: '', follow_up_date: '' })
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Prescriptions</div>
          <div className="section-sub">
            {currentRole === 'doctor' ? 'Prescriptions you have issued' : 'Prescriptions issued to you'}
          </div>
        </div>
        {currentRole === 'doctor' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Prescription</button>
        )}
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>⚠️ {error}</div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : list.length === 0 ? (
          <div className="empty-state">No prescriptions yet</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{currentRole === 'doctor' ? 'Patient' : 'Doctor'}</th>
                  <th>Diagnosis</th><th>Medications</th><th>Issued</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>
                      {currentRole === 'doctor' ? p.patient?.full_name : p.doctor?.full_name}
                    </td>
                    <td>{p.diagnosis}</td>
                    <td style={{ color: 'var(--text2)', maxWidth: 220 }}>
                      {(p.medications || []).map((m) => m.name).join(', ')}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text3)' }}>{p.prescribed_at?.split('T')[0]}</td>
                    <td><Badge variant={p.is_active ? 'green' : 'gray'}>{p.is_active ? 'Active' : 'Closed'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {currentRole === 'doctor' && (
        <Modal
          show={showModal}
          onClose={() => setShowModal(false)}
          title="New Prescription"
          footer={
            <>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSubmit}>
                Issue Prescription
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select className="form-input" value={form.patient_id}
                onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))} required>
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.patient.id} value={p.patient.id}>{p.patient.full_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Diagnosis</label>
              <input className="form-input" value={form.diagnosis}
                onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Symptoms</label>
              <input className="form-input" value={form.symptoms}
                onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))} />
            </div>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Medicine name</label>
                <input className="form-input" value={form.medName}
                  onChange={(e) => setForm((p) => ({ ...p, medName: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Dosage</label>
                <input className="form-input" placeholder="500mg" value={form.dosage}
                  onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <input className="form-input" placeholder="2x daily" value={form.frequency}
                  onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input className="form-input" placeholder="7 days" value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Instructions / Notes</label>
              <textarea className="form-input" value={form.instructions}
                onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Follow-up date (optional)</label>
              <input className="form-input" type="date" value={form.follow_up_date}
                onChange={(e) => setForm((p) => ({ ...p, follow_up_date: e.target.value }))} />
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
