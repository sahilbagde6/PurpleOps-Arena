import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reportsAPI, incidentsAPI } from '../api'
import { Card, CardTitle, Badge, Dot, ProgressBar, PageHeader } from '../components/Shared'

const SEV_COLOR = { critical: 'red', high: 'amber', medium: 'blue', low: 'green' }
const STATUS_COLOR = { open: 'red', investigating: 'amber', resolved: 'green' }

export default function Dashboard() {
  const [scorecard, setScorecard] = useState(null)
  const [incidents, setIncidents] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    reportsAPI.scorecard().then((r) => setScorecard(r.data)).catch(() => {})
    incidentsAPI.list().then((r) => setIncidents(r.data.slice(0, 5))).catch(() => {})
  }, [])

  const metrics = scorecard ? [
    { val: scorecard.fired,           label: 'Detections fired',    color: 'var(--green)' },
    { val: scorecard.missed,          label: 'Missed techniques',   color: 'var(--red)'   },
    { val: `${scorecard.detection_rate}%`, label: 'Detection rate', color: 'var(--blue)'  },
    { val: `${Math.round(scorecard.mttd_seconds / 60)}m ${scorecard.mttd_seconds % 60}s`,
      label: 'Mean time to detect',   color: 'var(--purple)' },
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Dashboard">
        <Dot color="green" />
        <span style={{ fontSize: 12, color: 'var(--green)' }}>Lab online</span>
        <button className="btn btn-primary" onClick={() => navigate('/scenarios')}>+ New run</button>
      </PageHeader>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 20 }}>
          {metrics.map((m) => (
            <div key={m.label} className="card">
              <div style={{ fontSize: 24, fontWeight: 600, color: m.color, lineHeight: 1.1 }}>{m.val}</div>
              <div style={{ fontSize: 12, color: 'var(--tx-secondary)', marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Recent incidents */}
          <Card>
            <CardTitle>Recent incidents</CardTitle>
            {incidents.length === 0 ? (
              <p style={{ color: 'var(--tx-secondary)', fontSize: 13 }}>No incidents yet. Launch a scenario to get started.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {['Incident','Severity','Status','Time'].map((h) => (
                      <th key={h} style={{ color: 'var(--tx-secondary)', fontWeight: 400, textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/incidents')}>
                      <td style={{ padding: '7px 8px', borderBottom: '1px solid rgba(48,54,61,.4)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</td>
                      <td style={{ padding: '7px 8px', borderBottom: '1px solid rgba(48,54,61,.4)' }}>
                        <Badge variant={SEV_COLOR[inc.severity] || 'blue'}>{inc.severity}</Badge>
                      </td>
                      <td style={{ padding: '7px 8px', borderBottom: '1px solid rgba(48,54,61,.4)' }}>
                        <Badge variant={STATUS_COLOR[inc.status] || 'blue'}>{inc.status}</Badge>
                      </td>
                      <td style={{ padding: '7px 8px', borderBottom: '1px solid rgba(48,54,61,.4)', color: 'var(--tx-secondary)' }}>
                        {new Date(inc.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* AI insight */}
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <CardTitle style={{ margin: 0 }}>AI analyst insight</CardTitle>
              <Badge variant="purple">Copilot</Badge>
            </div>
            <div style={{
              background: 'rgba(188,140,255,.07)', border: '1px solid rgba(188,140,255,.2)',
              borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.6,
            }}>
              <span style={{ color: 'var(--purple)', fontWeight: 500 }}>Attack chain summary: </span>
              {scorecard
                ? `Detection rate is ${scorecard.detection_rate}% with ${scorecard.missed} missed technique${scorecard.missed !== 1 ? 's' : ''}. ${scorecard.enabled_rules} of ${scorecard.total_rules} rules are active.`
                : 'Run your first scenario to see AI-powered attack chain analysis here.'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn" style={{ fontSize: 11 }} onClick={() => navigate('/ai')}>Open AI panel</button>
              <button className="btn" style={{ fontSize: 11 }} onClick={() => navigate('/rules')}>Review rules</button>
            </div>
          </Card>
        </div>

        {/* Detection scorecard */}
        {scorecard && (
          <Card>
            <CardTitle>Detection scorecard</CardTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Detection rate', val: scorecard.detection_rate, max: 100, color: 'var(--green)' },
                { label: 'ATT&CK coverage', val: scorecard.enabled_rules / Math.max(scorecard.total_rules, 1) * 100, max: 100, color: 'var(--blue)' },
                { label: 'False positive rate', val: scorecard.false_positive_rate, max: 100, color: 'var(--amber)' },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--tx-secondary)' }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 500 }}>{s.val.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={s.val} color={s.color} />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
