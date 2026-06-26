// src/pages/Notifications.jsx
//
// NOTE: The backend does not yet expose a /api/notifications endpoint,
// so this page intentionally uses local mock data (src/data/mockData.js)
// as a UI placeholder. Wire it up the same way as Records.jsx once a
// notifications table + route is added on the backend.
import React, { useState } from 'react'
import { NOTIFICATIONS } from '../data/mockData'

export default function Notifications() {
  const [notifs, setNotifs] = useState(NOTIFICATIONS)

  const markAllRead = () =>
    setNotifs((p) => p.map((n) => ({ ...n, read: true })))

  const markRead = (id) =>
    setNotifs((p) => p.map((n) => n.id === id ? { ...n, read: true } : n))

  const unreadCount = notifs.filter((n) => !n.read).length

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">Notifications</div>
          {unreadCount > 0 && (
            <div className="section-sub">{unreadCount} unread</div>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifs.map((n) => (
          <div
            key={n.id}
            className="notif-item"
            onClick={() => markRead(n.id)}
            style={{ cursor: n.read ? 'default' : 'pointer' }}
          >
            <div
              className={`notif-dot-ind ${n.read ? 'read' : ''}`}
              style={{ marginTop: 5 }}
            />
            <div style={{ fontSize: 22, flexShrink: 0 }}>{n.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13.5,
                fontWeight: n.read ? 400 : 500,
                color: n.read ? 'var(--text2)' : 'var(--text)',
              }}>
                {n.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                {n.time}
              </div>
            </div>
            {!n.read && (
              <span className="badge badge-green" style={{ flexShrink: 0 }}>New</span>
            )}
          </div>
        ))}

        {notifs.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <div style={{ fontSize: 32 }}>🔔</div>
              <div style={{ fontSize: 13.5 }}>No notifications</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
