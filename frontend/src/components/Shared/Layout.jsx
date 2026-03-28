import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  { to: '/dashboard',  label: 'Dashboard' },
  { to: '/scenarios',  label: 'Scenario launcher' },
  { to: '/incidents',  label: 'Incidents' },
  { to: '/ai',         label: 'AI analyst' },
  { to: '/attack-map', label: 'ATT&CK map' },
  { to: '/rules',      label: 'Rule explorer' },
  { to: '/lab',        label: 'Lab assets' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const xpPercent = user
    ? Math.min(100, Math.round((user.xp_total % 2000) / 2000 * 100))
    : 0

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 210, flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{
          padding: '16px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #bc8cff, #58a6ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>P</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>PurpleOps Arena</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              style={({ isActive }) => ({
                display: 'block', padding: '9px 16px',
                fontSize: 13, textDecoration: 'none',
                color: isActive ? 'var(--blue)' : 'var(--tx-secondary)',
                background: isActive ? 'rgba(88,166,255,.07)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--blue)' : '2px solid transparent',
                transition: 'all .15s',
              })}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          {user && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #bc8cff, #58a6ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0,
                }}>
                  {user.display_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.display_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--purple)' }}>Lv {user.level} · {user.role}</div>
                </div>
              </div>
              <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2, marginBottom: 4 }}>
                <div style={{ height: '100%', width: `${xpPercent}%`, background: 'linear-gradient(90deg, #bc8cff, #58a6ff)', borderRadius: 2, transition: 'width .5s' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--tx-muted)', marginBottom: 8 }}>
                {user.xp_total.toLocaleString()} XP
              </div>
            </>
          )}
          <button className="btn" onClick={handleLogout} style={{ width: '100%', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  )
}
