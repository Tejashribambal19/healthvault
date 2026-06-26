// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'

import Login         from './pages/Login'
import Dashboard     from './pages/Dashboard'
import Records       from './pages/Records'
import Upload        from './pages/Upload'
import Share         from './pages/Share'
import Chatbot       from './pages/Chatbot'
import Patients      from './pages/Patients'
import Prescriptions from './pages/Prescriptions'
import Users         from './pages/Users'
import Verify        from './pages/Verify'
import Oversight      from './pages/Oversight'
import Notifications from './pages/Notifications'
import Profile       from './pages/Profile'

// ── Route guard: redirect to login if not authenticated ─────────
function PrivateRoute({ children }) {
  const { currentRole } = useAuth()
  return currentRole ? children : <Navigate to="/login" replace />
}

// ── Role-specific route guard ───────────────────────────────────
function RoleRoute({ roles, children }) {
  const { currentRole } = useAuth()
  if (!currentRole) return <Navigate to="/login" replace />
  if (!roles.includes(currentRole)) return <Navigate to="/" replace />
  return children
}

// ── App routes (inside auth context) ───────────────────────────
function AppRoutes() {
  const { currentRole } = useAuth()

  if (!currentRole) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/"              element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/records"       element={<RoleRoute roles={['patient']}><Records /></RoleRoute>} />
        <Route path="/upload"        element={<RoleRoute roles={['patient']}><Upload /></RoleRoute>} />
        <Route path="/share"         element={<RoleRoute roles={['patient']}><Share /></RoleRoute>} />
        <Route path="/patients"      element={<RoleRoute roles={['doctor']}><Patients /></RoleRoute>} />
        <Route path="/prescriptions" element={<RoleRoute roles={['doctor', 'patient']}><Prescriptions /></RoleRoute>} />
        <Route path="/users"         element={<RoleRoute roles={['admin']}><Users /></RoleRoute>} />
        <Route path="/verify"        element={<RoleRoute roles={['admin']}><Verify /></RoleRoute>} />
        <Route path="/oversight"     element={<RoleRoute roles={['admin']}><Oversight /></RoleRoute>} />
        <Route path="/chatbot"       element={<PrivateRoute><Chatbot /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/profile"       element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/login"         element={<Navigate to="/" replace />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

// ── Root App ────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
