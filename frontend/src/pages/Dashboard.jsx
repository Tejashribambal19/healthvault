// src/pages/Dashboard.jsx
//
// Role-based dashboard. Stats are fetched LIVE from the backend.
// The inline AI widget calls the same /api/chatbot/message endpoint
// as the full Chatbot page.
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/ui/StatCard'
import { recordsAPI, prescriptionsAPI, sharingAPI, usersAPI, adminAPI, chatbotAPI } from '../services/api'
import { PlusIcon, SendIcon } from '../components/ui/Icons'

// ── Inline AI chat widget (calls the real backend) ──────────────
function DashboardChat({ userName }) {
  const [sessionId, setSessionId] = useState(null)
  const [msgs, setMsgs] = useState([{ greeting: true }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])

  const CHIPS = [
    { label: '🤒 Fever + headache', msg: 'I have a headache and mild fever' },
    { label: '😷 Cough', msg: 'Cough and sore throat since 2 days' },
    { label: '😴 Fatigue', msg: 'I feel very tired and have no energy' },
    { label: '🤢 Stomach issues', msg: 'Stomach pain and nausea after eating' },
    { label: '🚨 Chest pain', msg: 'Severe chest pain and difficulty breathing', urgent: true },
  ]

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setMsgs((p) => [...p, { role: 'user', text: msg }])
    setTyping(true)
    try {
      const res = await chatbotAPI.sendMessage({ message: msg, session_id: sessionId })
      setSessionId(res.session_id)
      setMsgs((p) => [...p, { role: 'bot', text: res.response, emergency: res.has_emergency }])
    } catch (err) {
      setMsgs((p) => [...p, { role: 'bot', text: `⚠️ ${err.message}`, emergency: false }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>AI Health Assistant</div>
            <div style={{ fontSize: 12, color: 'var(--accent)' }}>
              <span className="ai-online-dot" /> Live · calls backend /api/chatbot/message
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 0', borderBottom: '1px solid var(--border2)' }}>
        {CHIPS.map((c) => (
          <button key={c.label} className="ai-chip"
            style={c.urgent ? { background: 'var(--red-light)', borderColor: 'rgba(184,59,59,0.2)', color: 'var(--red)' } : {}}
            onClick={() => send(c.msg)}>
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: 100, maxHeight: 300, overflowY: 'auto', padding: '14px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.map((m, i) => {
          if (m.greeting) return (
            <div key={i} className="dash-bot-row">
              <div className="dash-bot-avatar">🤖</div>
              <div className="dash-bot-bubble">
                Hi <strong>{userName}!</strong> Describe any symptoms and I'll send them to the live backend for guidance.
              </div>
            </div>
          )
          if (m.role === 'user') return (
            <div key={i} className="dash-user-msg"><div className="dash-user-bubble">{m.text}</div></div>
          )
          return (
            <div key={i} className="dash-bot-row">
              <div className="dash-bot-avatar">🤖</div>
              <div className="dash-bot-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            </div>
          )
        })}
        {typing && (
          <div className="dash-bot-row">
            <div className="dash-bot-avatar">🤖</div>
            <div className="dash-bot-bubble dash-typing">Analysing…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border2)' }}>
        <input className="form-input" placeholder="Describe your symptoms…" style={{ flex: 1 }}
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }} />
        <button className="btn btn-primary" onClick={() => send()} disabled={!input.trim() || typing}>
          <SendIcon size={15} /> Ask
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, currentRole } = useAuth()
  const navigate = useNavigate()
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (currentRole === 'doctor') return <DoctorDashboard user={user} navigate={navigate} />
  if (currentRole === 'admin')  return <AdminDashboard user={user} navigate={navigate} />
  return <PatientDashboard user={user} today={today} navigate={navigate} />
}

function PatientDashboard({ user, today, navigate }) {
  const [stats, setStats] = useState({ records: '—', shares: '—', prescriptions: '—' })

  useEffect(() => {
    Promise.all([recordsAPI.myRecords(), sharingAPI.myShares(), prescriptionsAPI.myList()])
      .then(([recRes, shareRes, presRes]) => {
        setStats({
          records: recRes.records?.length ?? 0,
          shares: shareRes.shares?.length ?? 0,
          prescriptions: presRes.prescriptions?.length ?? 0,
        })
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Good morning, <em>{user?.full_name?.split(' ')[0]}</em> 👋</div>
          <div className="section-sub">{today}</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          <PlusIcon size={14} /> Upload Record
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Records"   value={stats.records} sub="from /api/records" />
        <StatCard label="Active Shares"   value={stats.shares}  sub="from /api/sharing/my-shares" />
        <StatCard label="Prescriptions"   value={stats.prescriptions} sub="from /api/prescriptions/my" />
        <StatCard label="Account"         value={user?.is_verified ? 'Active' : 'Pending'} sub="status" />
      </div>

      <DashboardChat userName={user?.full_name?.split(' ')[0]} />
    </>
  )
}

function DoctorDashboard({ user, navigate }) {
  const [stats, setStats] = useState({ patients: '—', prescriptions: '—' })

  useEffect(() => {
    Promise.all([usersAPI.myPatients(), prescriptionsAPI.issuedList()])
      .then(([patRes, presRes]) => {
        setStats({
          patients: patRes.patients?.length ?? 0,
          prescriptions: presRes.prescriptions?.length ?? 0,
        })
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Welcome, <em>{user?.full_name}</em> 👨‍⚕️</div>
          <div className="section-sub">{user?.is_verified ? 'Verified doctor account' : 'Awaiting admin verification'}</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/patients')}>View Patients</button>
      </div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Approved Patients" value={stats.patients} sub="from /api/users/my-patients" />
        <StatCard label="Prescriptions Issued" value={stats.prescriptions} sub="from /api/prescriptions/issued" />
      </div>
      <DashboardChat userName={user?.full_name?.split(' ')[0]} />
    </>
  )
}

function AdminDashboard({ user, navigate }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    adminAPI.stats().then((res) => setStats(res.stats)).catch(() => {})
  }, [])

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Admin Dashboard</div>
          <div className="section-sub">Live platform stats from /api/admin/stats</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/verify')}>Review Pending Doctors</button>
      </div>
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Patients"   value={stats?.totalPatients ?? '—'} />
        <StatCard label="Total Doctors"    value={stats?.totalDoctors ?? '—'} />
        <StatCard label="Pending Verify"   value={stats?.pendingDoctors ?? '—'} />
        <StatCard label="Total Records"    value={stats?.totalRecords ?? '—'} />
      </div>
    </>
  )
}
