// src/pages/Users.jsx — Admin: live user list from GET /api/admin/users
import React, { useEffect, useState } from 'react'
import { adminAPI } from '../services/api'
import Badge from '../components/ui/Badge'
import StatCard from '../components/ui/StatCard'

const ROLE_BADGE = { patient: 'green', doctor: 'blue', admin: 'orange' }

export default function Users() {
  const [roleFilter, setRoleFilter] = useState('')
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminAPI.users(roleFilter ? { role: roleFilter } : {}),
        adminAPI.stats(),
      ])
      setUsers(usersRes.users || [])
      setStats(statsRes.stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [roleFilter])

  const toggleStatus = async (id) => {
    try {
      await adminAPI.toggleUser(id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">User Management</div>
          <div className="section-sub">Live data from /api/admin/users</div>
        </div>
        <select className="form-input" style={{ width: 160 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--red)' }}>
          <div style={{ color: 'var(--red)', fontSize: 13.5 }}>⚠️ {error}</div>
        </div>
      )}

      {stats && (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <StatCard label="Patients"        value={stats.totalPatients} />
          <StatCard label="Doctors"         value={stats.totalDoctors} />
          <StatCard label="Pending Verify"  value={stats.pendingDoctors} />
          <StatCard label="Total Records"   value={stats.totalRecords} />
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="empty-state">No users found</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Verified</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{u.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.email}</div>
                    </td>
                    <td><Badge variant={ROLE_BADGE[u.role] || 'gray'}>{u.role}</Badge></td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.created_at?.split('T')[0]}</td>
                    <td><Badge variant={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Active' : 'Suspended'}</Badge></td>
                    <td><Badge variant={u.is_verified ? 'green' : 'amber'}>{u.is_verified ? 'Yes' : 'No'}</Badge></td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => toggleStatus(u.id)}
                      >
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
