export function Card({ children, style, className }) {
  return (
    <div className={`card ${className || ''}`} style={style}>
      {children}
    </div>
  )
}

export function CardTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em',
      color: 'var(--tx-secondary)', fontWeight: 500, marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

export function Badge({ variant = 'blue', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function Dot({ color }) {
  const colors = { green: 'var(--green)', red: 'var(--red)', amber: 'var(--amber)', blue: 'var(--blue)' }
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: colors[color] || color, marginRight: 5, flexShrink: 0,
    }} />
  )
}

export function ProgressBar({ value, max = 100, color = 'var(--green)' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
    </div>
  )
}

export function PageHeader({ title, children }) {
  return (
    <div style={{
      padding: '14px 24px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <h1 style={{ fontSize: 15, fontWeight: 600 }}>{title}</h1>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}
