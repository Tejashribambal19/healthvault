// src/components/layout/Sidebar.jsx
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HomeIcon, RecordsIcon, UploadIcon, ShareIcon, ChatIcon,
  PatientsIcon, PrescriptIcon, UsersIcon, VerifyIcon, CheckIcon,
} from '../ui/Icons'

const NAV = {
  patient: [
    { label: 'Dashboard',      path: '/',             Icon: HomeIcon       },
    { label: 'My Records',     path: '/records',      Icon: RecordsIcon    },
    { label: 'Upload Record',  path: '/upload',       Icon: UploadIcon     },
    { label: 'Share Records',  path: '/share',        Icon: ShareIcon      },
    { label: 'Prescriptions',  path: '/prescriptions',Icon: PrescriptIcon  },
    { label: 'AI Health Chat', path: '/chatbot',      Icon: ChatIcon       },
  ],
  doctor: [
    { label: 'Dashboard',      path: '/',             Icon: HomeIcon       },
    { label: 'My Patients',    path: '/patients',     Icon: PatientsIcon   },
    { label: 'Prescriptions',  path: '/prescriptions',Icon: PrescriptIcon  },
    { label: 'AI Health Chat', path: '/chatbot',      Icon: ChatIcon       },
  ],
  admin: [
    { label: 'Dashboard',      path: '/',             Icon: HomeIcon       },
    { label: 'Full Oversight', path: '/oversight',    Icon: PatientsIcon   },
    { label: 'User Management',path: '/users',        Icon: UsersIcon      },
    { label: 'Verify Doctors', path: '/verify',       Icon: VerifyIcon     },
    { label: 'AI Health Chat', path: '/chatbot',      Icon: ChatIcon       },
  ],
}

export default function Sidebar() {
  const { user, currentRole, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const items = NAV[currentRole] || []
  const roleColors = { patient: 'avatar-green', doctor: 'avatar-blue', admin: 'avatar-orange' }

  const handleNav = (path) => navigate(path)

  return (
    <aside className="sidebar-shell">
      {/* Logo */}
      <div className="sb-logo">
        <div className="logo-icon">
          <CheckIcon size={18} style={{ color: 'white' }} />
        </div>
        <span className="logo-text">Health<span>Vault</span></span>
      </div>

      {/* Role card */}
      <div style={{ padding: '12px 12px 0' }}>
        <div className={`sidebar-role-card ${currentRole ? `role-${currentRole}` : ''}`}>
          <div className={`avatar ${roleColors[currentRole]}`} style={{ width: 32, height: 32, fontSize: 12 }}>
            {user?.initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <span className="role-tag">{user?.tag}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', paddingBottom: 8 }}>
        <div className="nav-label" style={{ padding: '8px 8px 4px', display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          Menu
        </div>
        {items.map(({ label, path, Icon }) => {
          const active = location.pathname === path
          return (
            <div
              key={path}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => handleNav(path)}
            >
              <Icon size={16} />
              {label}
              {label === 'Share Records' && <span className="nav-badge">1</span>}
            </div>
          )
        })}
      </nav>

      {/* Bottom user card */}
      <div className="sb-bottom">
        <div
          className="user-card"
          onClick={() => navigate('/profile')}
          title="View profile"
        >
          <div className={`avatar ${roleColors[currentRole]}`}>{user?.initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.email}</div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'center', marginTop: 4, color: 'var(--red)' }}
          onClick={logout}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
