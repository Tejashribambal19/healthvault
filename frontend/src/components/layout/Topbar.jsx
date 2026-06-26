// src/components/layout/Topbar.jsx
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BellIcon, LogoutIcon } from '../ui/Icons'
import { useAuth } from '../../context/AuthContext'

const TITLES = {
  '/':              'Dashboard',
  '/records':       'My Records',
  '/upload':        'Upload Record',
  '/share':         'Share Records',
  '/chatbot':       'AI Health Assistant',
  '/patients':      'My Patients',
  '/prescriptions': 'Prescriptions',
  '/users':         'User Management',
  '/verify':        'Doctor Verification',
  '/notifications': 'Notifications',
  '/profile':       'My Profile',
}

export default function Topbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const title = TITLES[pathname] || 'HealthVault'

  return (
    <div className="topbar-shell">
      <div className="topbar-title">{title}</div>

      <div className="search-box">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"
          style={{ width: 15, height: 15, color: 'var(--text3)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input placeholder="Search records, doctors…" />
      </div>

      <div style={{ position: 'relative' }}>
        <button className="icon-btn" onClick={() => navigate('/notifications')}>
          <BellIcon size={15} />
        </button>
        <div style={{
          width: 7, height: 7, background: 'var(--red)', borderRadius: '50%',
          position: 'absolute', top: 8, right: 8,
        }} />
      </div>

      <button className="icon-btn" onClick={logout} title="Sign out">
        <LogoutIcon size={15} />
      </button>
    </div>
  )
}
