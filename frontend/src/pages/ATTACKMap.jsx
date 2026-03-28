import { useEffect, useState } from 'react'
import { useDetectionsStore } from '../store/appStore'
import { Card, CardTitle, Badge, PageHeader } from '../components/Shared'

const TACTICS = [
  'Recon','Res Dev','Init Access','Exec','Persist',
  'Priv Esc','Def Evade','Cred Access','Discovery','Lat Move',
  'Collection','C2','Exfil','Impact',
]

// Demo coverage data
const DEMO_HEATMAP = [
  { technique_id: 'T1566.001', tactic: 'Init Access', status: 'detected', count: 1 },
  { technique_id: 'T1059.001', tactic: 'Exec',        status: 'detected', count: 3 },
  { technique_id: 'T1059.003', tactic: 'Exec',        status: 'partial',  count: 1 },
  { technique_id: 'T1134',     tactic: 'Priv Esc',    status: 'missed',   count: 2 },
  { technique_id: 'T1547',     tactic: 'Persist',     status: 'detected', count: 1 },
  { technique_id: 'T1003.001', tactic: 'Cred Access', status: 'detected', count: 4 },
  { technique_id: 'T1040',     tactic: 'Cred Access', status: 'partial',  count: 1 },
  { technique_id: 'T1018',     tactic: 'Discovery',   status: 'detected', count: 2 },
  { technique_id: 'T1021.002', tactic: 'Lat Move',    status: 'detected', count: 2 },
  { technique_id: 'T1055',     tactic: 'Priv Esc',    status: 'missed',   count: 1 },
  { technique_id: 'T1078',     tactic: 'Persist',     status: 'partial',  count: 1 },
]

const STATUS_COLOR = {
  detected: { bg: 'rgba(63,185,80,.55)',  border: 'rgba(63,185,80,.8)' },
  partial:  { bg: 'rgba(210,153,34,.45)', border: 'rgba(210,153,34,.7)' },
  missed:   { bg: 'rgba(248,81,73,.35)',  border: 'rgba(248,81,73,.6)' },
  empty:    { bg: 'var(--bg-tertiary)',   border: 'var(--border)' },
}

export default function ATTACKMap() {
  const { heatmap, fetchHeatmap } = useDetectionsStore()
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => { fetchHeatmap() }, [fetchHeatmap])

  const displayHeatmap = heatmap.length > 0 ? heatmap : DEMO_HEATMAP

  // Build tactic → techniques map
  const byTactic = {}
  TACTICS.forEach((t) => { byTactic[t] = [] })
  displayHeatmap.forEach((item) => {
    const tactic = item.tactic || 'Exec'
    if (byTactic[tactic]) byTactic[tactic].push(item)
  })

  const detected = displayHeatmap.filter((d) => d.status === 'detected').length
  const partial  = displayHeatmap.filter((d) => d.status === 'partial').length
  const missed   = displayHeatmap.filter((d) => d.status === 'missed').length
  const total    = displayHeatmap.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="ATT&CK map">
        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          {[
            { color: 'var(--green)', label: `Detected (${detected})` },
            { color: 'var(--amber)', label: `Partial (${partial})` },
            { color: 'var(--red)',   label: `Missed (${missed})` },
          ].map((l) => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
              {l.label}
            </span>
          ))}
        </div>
      </PageHeader>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Heatmap grid */}
        <Card style={{ marginBottom: 16 }}>
          <CardTitle>Enterprise ATT&CK matrix — technique coverage</CardTitle>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TACTICS.length}, 1fr)`, gap: 4 }}>
            {/* Tactic headers */}
            {TACTICS.map((t) => (
              <div key={t} style={{
                fontSize: 9, color: 'var(--tx-secondary)', textAlign: 'center',
                padding: '0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{t}</div>
            ))}
            {/* Cells — up to 6 rows */}
            {Array.from({ length: 6 }).map((_, row) =>
              TACTICS.map((tactic) => {
                const item = byTactic[tactic]?.[row]
                const status = item?.status || 'empty'
                const colors = STATUS_COLOR[status]
                return (
                  <div key={`${tactic}-${row}`}
                    style={{
                      height: 24, borderRadius: 3,
                      background: colors.bg, border: `1px solid ${colors.border}`,
                      cursor: item ? 'pointer' : 'default', position: 'relative',
                      transition: 'opacity .1s',
                    }}
                    title={item ? `${item.technique_id} · ${status}` : ''}
                    onMouseEnter={() => item && setTooltip(item)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })
            )}
          </div>
          {tooltip && (
            <div style={{
              marginTop: 12, padding: '8px 12px', background: 'var(--bg-tertiary)',
              borderRadius: 6, fontSize: 12, border: '1px solid var(--border)',
            }}>
              <strong>{tooltip.technique_id}</strong> · {tooltip.tactic} ·{' '}
              <span style={{
                color: tooltip.status === 'detected' ? 'var(--green)' : tooltip.status === 'missed' ? 'var(--red)' : 'var(--amber)',
              }}>{tooltip.status}</span>{' '}
              · {tooltip.count} event{tooltip.count !== 1 ? 's' : ''}
            </div>
          )}
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Detected */}
          <Card>
            <CardTitle>Top detected techniques</CardTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Technique','Tactic','Count'].map((h) => (
                  <th key={h} style={{ color: 'var(--tx-secondary)', fontWeight: 400, textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {displayHeatmap.filter((d) => d.status === 'detected').map((d) => (
                  <tr key={d.technique_id}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(48,54,61,.4)', fontFamily: 'monospace', fontSize: 11 }}>{d.technique_id}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(48,54,61,.4)', color: 'var(--tx-secondary)' }}>{d.tactic}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(48,54,61,.4)' }}>
                      <Badge variant="green">{d.count}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Gaps */}
          <Card>
            <CardTitle>Coverage gaps (missed / partial)</CardTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>{['Technique','Issue','Action'].map((h) => (
                  <th key={h} style={{ color: 'var(--tx-secondary)', fontWeight: 400, textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {displayHeatmap.filter((d) => d.status !== 'detected').map((d) => (
                  <tr key={d.technique_id}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(48,54,61,.4)', fontFamily: 'monospace', fontSize: 11 }}>{d.technique_id}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(48,54,61,.4)' }}>
                      <Badge variant={d.status === 'missed' ? 'red' : 'amber'}>{d.status}</Badge>
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid rgba(48,54,61,.4)' }}>
                      <button className="btn" style={{ fontSize: 10, padding: '2px 8px' }}
                        onClick={() => window.open(`/ai?q=How+to+detect+${d.technique_id}`)}>
                        Fix →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  )
}
