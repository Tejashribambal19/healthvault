// src/services/api.js
//
// This is the ONLY file that knows the backend's base URL.
// Every other file imports functions from here instead of
// calling axios/fetch directly — keeps API logic in one place.

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach JWT token to every request automatically ─────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Global response handling ────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || 'Network error. Is the backend running?'
    // Auto logout on expired/invalid token
    if (error.response?.status === 401) {
      localStorage.removeItem('hv_token')
      localStorage.removeItem('hv_user')
    }
    return Promise.reject(new Error(message))
  }
)

export default api

// ════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// ════════════════════════════════════════════════════════════════
// MEDICAL RECORDS
// ════════════════════════════════════════════════════════════════
export const recordsAPI = {
  upload: (formData) =>
    api.post('/records/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  myRecords:        (params) => api.get('/records', { params }),
  patientRecords:   (patientId) => api.get(`/records/patient/${patientId}`),
  getById:          (id) => api.get(`/records/${id}`),
  remove:           (id) => api.delete(`/records/${id}`),
  emergencyRecords: (patientId) => api.get(`/records/emergency/${patientId}`),
}

// ════════════════════════════════════════════════════════════════
// PRESCRIPTIONS
// ════════════════════════════════════════════════════════════════
export const prescriptionsAPI = {
  create:    (data) => api.post('/prescriptions', data),
  myList:    ()     => api.get('/prescriptions/my'),
  issuedList:()     => api.get('/prescriptions/issued'),
  getById:   (id)   => api.get(`/prescriptions/${id}`),
}

// ════════════════════════════════════════════════════════════════
// SHARING / ACCESS CONTROL
// ════════════════════════════════════════════════════════════════
export const sharingAPI = {
  shareRecord:    (data)    => api.post('/sharing/share-record', data),
  revoke:         (shareId) => api.delete(`/sharing/revoke/${shareId}`),
  myShares:       ()        => api.get('/sharing/my-shares'),
  requestAccess:  (data)    => api.post('/sharing/request-access', data),
  resolveAccess:  (id, action) => api.put(`/sharing/access/${id}`, { action }),
  accessRequests: ()        => api.get('/sharing/access-requests'),
  getQR:          (recordId)=> api.get(`/sharing/qr/${recordId}`),
}

// ════════════════════════════════════════════════════════════════
// USERS (doctors / patients directory + profile)
// ════════════════════════════════════════════════════════════════
export const usersAPI = {
  doctors:       (params) => api.get('/users/doctors', { params }),
  myDoctors:     ()       => api.get('/users/my-doctors'),
  myPatients:    ()       => api.get('/users/my-patients'),
  updateProfile: (data)   => api.put('/users/profile', data),
}

// ════════════════════════════════════════════════════════════════
// AI CHATBOT
// ════════════════════════════════════════════════════════════════
export const chatbotAPI = {
  sendMessage: (data) => api.post('/chatbot/message', data),
  history:     (session_id) => api.get('/chatbot/history', { params: { session_id } }),
  sessions:    () => api.get('/chatbot/sessions'),
}

// ════════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════════
export const adminAPI = {
  users:        (params) => api.get('/admin/users', { params }),
  verifyDoctor: (id, action) => api.put(`/admin/verify-doctor/${id}`, { action }),
  toggleUser:   (id) => api.put(`/admin/toggle-user/${id}`),
  stats:        () => api.get('/admin/stats'),
  auditLogs:    () => api.get('/admin/audit-logs'),
  // Full oversight — admin only, bypasses normal sharing rules
  patientOverview: (id) => api.get(`/admin/patients/${id}`),
  doctorOverview:  (id) => api.get(`/admin/doctors/${id}`),
}
