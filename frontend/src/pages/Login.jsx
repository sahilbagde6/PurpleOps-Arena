import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const { login, register, loading, error } = useAuthStore()
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    if (mode === 'login') {
      await login(email, password)
    } else {
      await register(email, displayName, password)
    }
    if (!useAuthStore.getState().error) navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{ width: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #bc8cff, #58a6ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff',
          }}>P</div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>PurpleOps Arena</h1>
          <p style={{ fontSize: 13, color: 'var(--tx-secondary)', marginTop: 4 }}>
            AI-powered purple team cyber range
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28 }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
            {['login', 'register'].map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px 0', background: 'none', border: 'none',
                borderBottom: mode === m ? '2px solid var(--blue)' : '2px solid transparent',
                color: mode === m ? 'var(--blue)' : 'var(--tx-secondary)',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                marginBottom: -1, transition: 'all .15s',
              }}>
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--tx-secondary)', display: 'block', marginBottom: 6 }}>
                  Display name
                </label>
                <input
                  type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Arjun Joshi" required
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 6,
                    border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                    color: 'var(--tx-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  }}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: 'var(--tx-secondary)', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@purpleops.io" required
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--tx-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--tx-secondary)', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={8}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--tx-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 6, fontSize: 12,
                background: 'rgba(248,81,73,.1)', border: '1px solid rgba(248,81,73,.3)',
                color: 'var(--red)',
              }}>{error}</div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ width: '100%', padding: '10px', fontSize: 14, marginTop: 4 }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'var(--tx-muted)', textAlign: 'center', marginTop: 16 }}>
            Demo: analyst@demo.com / password123
          </p>
        </div>
      </div>
    </div>
  )
}
