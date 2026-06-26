// src/components/ui/StatCard.jsx
import React from 'react'

export default function StatCard({ label, value, sub, change, changeDir }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && (
        <div className="stat-sub">
          {change && (
            <span className={`stat-change ${changeDir || 'up'}`}>{change}</span>
          )}{' '}
          {sub}
        </div>
      )}
    </div>
  )
}
