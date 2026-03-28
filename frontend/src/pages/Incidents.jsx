import { useEffect, useState } from 'react'
import { useIncidentsStore } from '../store/appStore'
import { Card, CardTitle, Badge, Dot, PageHeader } from '../components/Shared'

const SEV_COLOR    = { critical: 'red', high: 'amber', medium: 'blue', low: 'green' }
const STATUS_COLOR = { open: 'red', investigating: 'amber', resolved: 'green' }

export default function Incidents() {
  const { incidents, timeline, fetchIncidents, fetchTimeline } = useIncidentsStore()
  const [selectedId, setSelectedId] = useState(null)
  const [showAllIncidents, setShowAllIncidents] = useState(false)

  useEffect(() => { 
    fetchIncidents(showAllIncidents) 
  }, [fetchIncidents, showAllIncidents])

  const selectIncident = (id) => {
    setSelectedId(id)
    fetchTimeline(id).catch(err => console.error('Failed to fetch timeline:', err))
  }

  const dotColor = (evt) => {
    if (evt.technique_id === 'RESPONSE') return 'var(--green)'
    if (evt.detected === false) return 'var(--red)'
    return 'var(--amber)'
  }

  const timelineItems = timeline?.timeline || []
  const hasData = timeline && incidents.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Incident timeline" />

      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Incident list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Toggle button */}
          <button
            onClick={() => setShowAllIncidents(!showAllIncidents)}
            style={{
              padding: '8px 12px',
              background: showAllIncidents ? 'var(--blue)' : 'var(--bg-tertiary)',
              border: `1px solid ${showAllIncidents ? 'var(--blue)' : 'var(--border)'}`,
              borderRadius: 6,
              color: 'var(--tx-primary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: 8,
              transition: 'all .15s',
            }}
          >
            {showAllIncidents ? 'All Incidents' : 'Recent (24h)'}
          </button>

          {/* Incident cards */}
          {incidents.length > 0 ? (
            incidents.map((inc) => (
              <div key={inc.id} onClick={() => selectIncident(inc.id)} style={{
                background: selectedId === inc.id ? 'rgba(88,166,255,.07)' : 'var(--bg-secondary)',
                border: `1px solid ${selectedId === inc.id ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: 8, padding: 12, cursor: 'pointer', transition: 'all .15s',
              }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 6, lineHeight: 1.3 }}>{inc.title}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge variant={SEV_COLOR[inc.severity] || 'blue'}>{inc.severity}</Badge>
                  <Badge variant={STATUS_COLOR[inc.status] || 'blue'}>{inc.status}</Badge>
                </div>
                <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 6 }}>
                  {new Date(inc.created_at).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 12, color: 'var(--tx-muted)', textAlign: 'center', padding: 16 }}>
              {showAllIncidents ? 'No incidents found' : 'No recent incidents (last 24h)\n\nRun a scenario to create incidents'}
            </div>
          )}
        </div>

        {/* Timeline detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {hasData ? (
            <>
              <Card>
                <CardTitle>Attack timeline — {timeline.incident.title}</CardTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {timelineItems.map((evt, i) => (
                    <div key={evt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor(evt), marginTop: 4, flexShrink: 0 }} />
                        {i < timelineItems.length - 1 && (
                          <div style={{ width: 1, height: 40, background: 'var(--border)', marginTop: 2 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: 20, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--tx-muted)', marginBottom: 2 }}>
                          {new Date(evt.occurred_at).toLocaleTimeString()}
                        </div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {evt.technique_id !== 'RESPONSE' ? `${evt.technique_id} — ` : ''}{evt.command}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--tx-secondary)', marginTop: 2 }}>Host: {evt.host}</div>
                        <div style={{ marginTop: 4 }}>
                          {evt.detections && evt.detections.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {evt.detections.map((det, idx) => (
                                <Badge key={idx} variant="green">
                                  {det.rule_name} · {(det.confidence * 100).toFixed(0)}%
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="red">Missed — No rule</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Evidence + Response */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Card>
                  <CardTitle>Supporting evidence</CardTitle>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                    color: 'var(--green)', background: 'var(--bg-primary)',
                    padding: 10, borderRadius: 6, lineHeight: 1.8,
                  }}>
                    <div><span style={{ color: 'var(--tx-muted)' }}>EventID:</span> 10</div>
                    <div><span style={{ color: 'var(--tx-muted)' }}>Process:</span> mimikatz.exe</div>
                    <div><span style={{ color: 'var(--tx-muted)' }}>Target:</span> lsass.exe</div>
                    <div><span style={{ color: 'var(--tx-muted)' }}>Access:</span> 0x1fffff</div>
                    <div style={{ marginTop: 6 }}><span style={{ color: 'var(--red)' }}>ALERT</span> SIGMA-LSASS-001 · 94%</div>
                  </div>
                </Card>
                <Card>
                  <CardTitle>Recommended response</CardTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon: '✓', color: 'var(--green)', text: 'Host isolated — WIN-TARGET-01' },
                      { icon: '!', color: 'var(--amber)', text: 'Enable Sysmon for better detection' },
                      { icon: '!', color: 'var(--amber)', text: 'Review detection coverage gaps' },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: 12,
                      }}>
                        <span style={{ color: item.color, fontWeight: 700 }}>{item.icon}</span>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <p style={{ color: 'var(--tx-secondary)', fontSize: 13 }}>
                {incidents.length === 0 
                  ? 'No incidents found. Run a scenario to create incidents.'
                  : 'Select an incident on the left to view its attack timeline, evidence, and recommendations.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
