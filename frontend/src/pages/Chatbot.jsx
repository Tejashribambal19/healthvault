// src/pages/Chatbot.jsx
//
// Sends each message to the REAL backend rule-based engine:
// POST /api/chatbot/message  (see backend/src/controllers/chatbot.controller.js)
import React, { useState, useRef, useEffect } from 'react'
import { chatbotAPI } from '../services/api'
import { SendIcon, WarningIcon } from '../components/ui/Icons'

const QUICK_SYMPTOMS = [
  'I have a fever and headache for 2 days',
  'Cough and sore throat',
  'Stomach pain and nausea',
  'Severe chest pain and shortness of breath',
  'I feel dizzy and lightheaded',
  'Joint pain in my knee',
]

function FormattedText({ text }) {
  // Backend returns markdown-ish text with **bold** and bullet lines.
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g)
        return (
          <React.Fragment key={i}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j}>{p.slice(2, -2)}</strong>
                : <span key={j}>{p}</span>
            )}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        )
      })}
    </>
  )
}

export default function Chatbot() {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || isTyping) return
    setInput('')
    setError('')
    setMessages((p) => [...p, { role: 'user', text: msg }])
    setIsTyping(true)

    try {
      const res = await chatbotAPI.sendMessage({ message: msg, session_id: sessionId })
      setSessionId(res.session_id)
      setMessages((p) => [...p, {
        role: 'assistant',
        text: res.response,
        emergency: res.has_emergency,
        matched: res.matched_conditions,
      }])
    } catch (err) {
      setError(err.message)
      setMessages((p) => [...p, {
        role: 'assistant',
        text: `⚠️ Could not reach the AI backend: ${err.message}\n\nMake sure the Express server is running and \`VITE_API_URL\` points to it.`,
        emergency: false,
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      <div className="section-header">
        <div>
          <div className="section-title">AI Health Assistant</div>
          <div className="section-sub">Live rule-based engine running on the backend — not a diagnosis tool</div>
        </div>
      </div>

      <div style={{ maxWidth: 700 }}>
        <div style={{
          background: 'var(--amber-light)', border: '1px solid rgba(139,94,10,0.15)',
          borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <WarningIcon size={18} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: 'var(--amber)' }}>
            <strong>Disclaimer:</strong> HealthBot provides general guidance only. It is not a medical diagnosis.
            Always consult a qualified doctor. In an emergency, call your local emergency number immediately.
          </div>
        </div>

        <div className="chat-wrap">
          <div className="chat-messages">
            <div>
              <div className="bot-name">HealthBot</div>
              <div className="chat-bubble bot">
                Hello! Describe your symptoms and I'll send them to the backend symptom-analysis engine
                for general guidance, home remedies, and a doctor-visit recommendation.
                <br /><br />
                <em style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Try: "I have fever, headache and body pain since yesterday"
                </em>
              </div>
            </div>

            {messages.map((m, i) => {
              if (m.role === 'user') return (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div className="chat-bubble user">{m.text}</div>
                </div>
              )
              return (
                <div key={i}>
                  <div className="bot-name">HealthBot</div>
                  <div className="chat-bubble bot" style={m.emergency ? { borderLeft: '3px solid var(--red)' } : {}}>
                    <FormattedText text={m.text} />
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div>
                <div className="bot-name">HealthBot</div>
                <div className="chat-bubble bot" style={{ color: 'var(--text3)', fontStyle: 'italic' }}>
                  Analysing symptoms…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              type="text" placeholder="Describe your symptoms…"
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey} disabled={isTyping}
            />
            <button className="btn btn-primary" onClick={() => send()} disabled={!input.trim() || isTyping}>
              Send <SendIcon size={14} />
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Quick symptoms:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_SYMPTOMS.map((s) => (
              <button key={s} className="btn btn-secondary btn-sm" onClick={() => send(s)} disabled={isTyping}
                style={s.includes('chest') ? { color: 'var(--red)', borderColor: 'rgba(184,59,59,0.3)' } : {}}>
                {s.includes('chest') ? '🚨 ' : ''}{s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
