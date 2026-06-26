// src/components/layout/AppLayout.jsx
import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './Sidebar.css'
import './Topbar.css'

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  )
}
