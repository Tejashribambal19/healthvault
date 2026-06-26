// src/components/ui/RecordItem.jsx
import React from 'react'
import Badge from './Badge'

export default function RecordItem({ record }) {
  return (
    <div className="record-item">
      <div className={`record-icon ${record.icon}`}>{record.type}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {record.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
          {record.doctor || record.date}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <Badge variant={record.badge?.replace('badge-', '') || 'gray'}>
          {record.type}
        </Badge>
      </div>
    </div>
  )
}
