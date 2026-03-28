import { useState, useRef, useEffect } from 'react'
import { aiAPI } from '../api'
import { Card, CardTitle, Badge, PageHeader } from '../components/Shared'

const MODES = ['beginner', 'analyst', 'rca']
const MODE_LABEL = { beginner: 'Beginner mode', analyst: 'Analyst mode', rca: 'Root cause' }

const QUICK_PROMPTS = [
  'Why is LSASS access suspicious?',
  'What logs support this detection?',
  'How do I detect T1134 token impersonation?',
  'What should I do next after this alert?',
  'Explain the attack chain in simple terms',
]

export default function AIAnalyst() {
  const [mode, setMode] = useState('beginner')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I\'m PurpleOps Copilot — your AI security analyst. Ask me about any alert, log, or technique detected in your cyber range. I can explain in beginner or technical terms, perform root cause analysis, and suggest detection improvements.',
    },
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || streaming) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: msg }])
    setStreaming(true)

    // Add placeholder AI message
    setMessages((prev) => [...prev, { role: 'assistant', text: '' }])

    try {
      let full = ''
      await aiAPI.chatStream(msg, mode, (chunk) => {
        full += chunk
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', text: full }
          return copy
        })
      })
    } catch {
      // Fallback demo response
      const demo = getDemoResponse(msg, mode)
      setMessages((prev) => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', text: demo }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="AI analyst">
        <Badge variant="purple">Powered by Claude</Badge>
      </PageHeader>

      <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 260px', gap: 0 }}>
        {/* Chat panel */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: 24, gap: 16, overflow: 'hidden' }}>
          {/* Mode chips */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {MODES.map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)',
                background: mode === m ? 'rgba(88,166,255,.1)' : 'transparent',
                borderColor: mode === m ? 'var(--blue)' : 'var(--border)',
                color: mode === m ? 'var(--blue)' : 'var(--tx-secondary)',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}>{MODE_LABEL[m]}</button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: msg.role === 'user' ? '70%' : '100%',
                background: msg.role === 'user' ? 'rgba(88,166,255,.1)' : 'var(--bg-secondary)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(88,166,255,.25)' : 'var(--border)'}`,
                borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ color: 'var(--purple)', fontWeight: 600, fontSize: 11, marginBottom: 6 }}>
                    PurpleOps Copilot · {MODE_LABEL[mode]}
                    {i === messages.length - 1 && streaming && (
                      <span style={{ marginLeft: 8, color: 'var(--tx-muted)' }}>▋</span>
                    )}
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text || (streaming && i === messages.length - 1 ? '…' : '')}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about any alert, log, or technique…"
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                color: 'var(--tx-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button className="btn btn-primary" onClick={() => sendMessage()} disabled={streaming || !input.trim()}>
              Send
            </button>
          </div>
        </div>

        {/* Sidebar: quick prompts */}
        <div style={{ borderLeft: '1px solid var(--border)', padding: 16, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-secondary)', fontWeight: 500, marginBottom: 12 }}>
            Quick prompts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QUICK_PROMPTS.map((p) => (
              <button key={p} onClick={() => sendMessage(p)} style={{
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '8px 10px', color: 'var(--tx-primary)',
                fontSize: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                lineHeight: 1.4, transition: 'all .15s',
              }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--blue)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >{p}</button>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--tx-secondary)', fontWeight: 500, marginBottom: 10 }}>
              Context cards
            </div>
            {[
              { label: 'Last run', val: 'Credential access chain', color: 'var(--amber)' },
              { label: 'Top alert', val: 'T1003.001 LSASS', color: 'var(--red)' },
              { label: 'Coverage', val: '75% detected', color: 'var(--green)' },
            ].map((c) => (
              <div key={c.label} className="card" style={{ marginBottom: 8, padding: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>{c.label}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: c.color, marginTop: 2 }}>{c.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getDemoResponse(msg, mode) {
  const lower = msg.toLowerCase()
  if (lower.includes('lsass')) {
    return mode === 'beginner'
      ? 'LSASS (Local Security Authority Subsystem Service) is the Windows process that stores your passwords in memory. When an attacker accesses it, they can steal all currently logged-in passwords — like picking the lock on a password vault. This is detected by Sysmon Event ID 10 when another process opens a handle to lsass.exe.'
      : 'LSASS memory access (T1003.001) occurs when a process opens a handle to lsass.exe with read access flags (0x1fffff, 0x1010, 0x143a). Mimikatz\'s sekurlsa::logonpasswords reads NTLM hashes and Kerberos tickets from LSASS memory. Detection relies on Sysmon EID 10 with TargetImage=lsass.exe. Key IOC: GrantedAccess=0x1fffff from non-system processes.'
  }
  if (lower.includes('t1134') || lower.includes('token')) {
    return 'T1134 Token Impersonation/Theft occurs when an attacker duplicates a security token from a higher-privileged process to escalate privileges. Tools like PrintSpoofer exploit the SeImpersonatePrivilege to steal a SYSTEM token. Detection requires Sysmon EID 10 monitoring process access events — this is commonly the #1 telemetry gap found in lab exercises.'
  }
  return `I'm analysing your query in ${mode} mode. In a fully deployed environment with the Anthropic API configured, I would provide a detailed ${mode === 'beginner' ? 'plain-language' : 'technical'} analysis of "${msg}" based on your live threat data. Configure your ANTHROPIC_API_KEY in the backend .env file to enable live AI responses.`
}
