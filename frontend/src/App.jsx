import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Shared/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scenarios from './pages/Scenarios'
import Incidents from './pages/Incidents'
import AIAnalyst from './pages/AIAnalyst'
import ATTACKMap from './pages/ATTACKMap'
import RuleExplorer from './pages/RuleExplorer'
import LabAssets from './pages/LabAssets'

// Fix 9: show loading spinner while auth check is in flight
// avoids flash-redirect on page refresh with a valid token
function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const authChecked = useAuthStore((s) => s.authChecked)
  const token = localStorage.getItem('access_token')

  if (!authChecked) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0d1117',
      }}>
        <div style={{ color: '#8b949e', fontSize: 14 }}>Loading…</div>
      </div>
    )
  }

  if (!token && !user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      fetchMe()
    } else {
      useAuthStore.getState().setAuthChecked()
    }
  }, [fetchMe])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="scenarios"  element={<Scenarios />} />
        <Route path="incidents"  element={<Incidents />} />
        <Route path="ai"         element={<AIAnalyst />} />
        <Route path="attack-map" element={<ATTACKMap />} />
        <Route path="rules"      element={<RuleExplorer />} />
        <Route path="lab"        element={<LabAssets />} />
      </Route>
    </Routes>
  )
}
