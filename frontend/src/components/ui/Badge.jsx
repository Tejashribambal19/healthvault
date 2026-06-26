// src/components/ui/Badge.jsx
import React from 'react'

export default function Badge({ children, variant = 'green' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
