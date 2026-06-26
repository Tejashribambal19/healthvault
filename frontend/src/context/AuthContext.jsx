// src/context/AuthContext.jsx
//
// Holds the logged-in user + JWT token in memory + localStorage.
// login()/register() call the REAL backend (see services/api.js).
// All pages read the current user via useAuth().

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hv_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('hv_token'))
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  const currentRole = user?.role || null

  // On first load, if we have a token but no cached user object,
  // verify the token is still valid by fetching the live profile.
  useEffect(() => {
    if (token && !user) {
      authAPI.me()
        .then((res) => persistUser(res.user))
        .catch(() => logout())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const persistUser = (u) => {
    setUser(u)
    localStorage.setItem('hv_user', JSON.stringify(u))
  }

  const persistToken = (t) => {
    setToken(t)
    localStorage.setItem('hv_token', t)
  }

  // ── LOGIN: real call to POST /api/auth/login ───────────────────
  const login = async ({ email, password }) => {
    setLoading(true)
    setAuthError(null)
    try {
      const res = await authAPI.login({ email, password })
      persistToken(res.token)
      persistUser(res.user)
      return res.user
    } catch (err) {
      setAuthError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // ── REGISTER: real call to POST /api/auth/register ─────────────
  const register = async (payload) => {
    setLoading(true)
    setAuthError(null)
    try {
      const res = await authAPI.register(payload)
      persistToken(res.token)
      persistUser(res.user)
      return res.user
    } catch (err) {
      setAuthError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('hv_token')
    localStorage.removeItem('hv_user')
    setUser(null)
    setToken(null)
  }

  const updateUser = (patch) => {
    const updated = { ...user, ...patch }
    persistUser(updated)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, currentRole, loading, authError, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
