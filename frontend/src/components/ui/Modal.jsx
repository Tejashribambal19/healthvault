// src/components/ui/Modal.jsx
import React from 'react'

export default function Modal({ show, onClose, title, children, footer }) {
  if (!show) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, marginBottom: 20 }}>
            {title}
          </div>
        )}
        {children}
        {footer && <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>{footer}</div>}
      </div>
    </div>
  )
}
