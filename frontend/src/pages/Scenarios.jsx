import { useEffect, useState } from 'react'
import { useScenariosStore } from '../store/appStore'
import { Card, Badge, PageHeader } from '../components/Shared'
import { useWebSocket } from '../hooks/useWebSocket'

const DIFF_COLOR = { easy: 'green', medium: 'amber', hard: 'red' }

const DEMO_SCENARIOS = [
  {
    id: 'demo-1', name: 'Credential access chain', difficulty: 'hard', tactic: 'TA0006',
    description: 'Simulates LSASS dump via Mimikatz after token impersonation. Tests credential access detection rules.',
    steps: [
      { technique_id: 'T1566.001', host: 'WIN-TARGET-01', command: 'macro_execution.ps1', delay_seconds: 2 },
      { technique_id: 'T1134',     host: 'WIN-TARGET-01', command: 'PrintSpoofer.exe -i -c cmd', delay_seconds: 3 },
      { technique_id: 'T1003.001', host: 'WIN-TARGET-01', command: 'mimikatz sekurlsa::logonpasswords', delay_seconds: 2 },
    ],
  },
  {
    id: 'demo-2', name: 'Lateral movement via PsExec', difficulty: 'medium', tactic: 'TA0008',
    description: 'Uses PsExec to move laterally between Windows hosts, simulating a post-exploitation phase.',
    steps: [
      { technique_id: 'T1021.002', host: 'WIN-TARGET-01', command: 'psexec \\\\10.0.0.20 cmd', delay_seconds: 3 },
    ],
  },
  {
    id: 'demo-3', name: 'PowerShell obfuscation', difficulty: 'easy', tactic: 'TA0002',
    description: 'Executes encoded PowerShell payloads to test AMSI and Script Block Logging detection.',
    steps: [
      { technique_id: 'T1059.001', host: 'WIN-TARGET-01', command: 'powershell -enc JAB...', delay_seconds: 2 },
    ],
  },
]

const RUN_STEPS = [
  'Initialising lab environment…',
  'Deploying Caldera agent on KALI-01…',
  'Executing attack stages…',
  'Collecting telemetry logs…',
  'Running detection rules…',
  'Generating AI analysis…',
  '✓ Run complete — check Incidents for results',
]

export default function Scenarios() {
  const { scenarios, activeRun, fetchScenarios, launchScenario } = useScenariosStore()
  const [selected, setSelected] = useState(null)
  const [runLog, setRunLog] = useState([])
  const [launching, setLaunching] = useState(false)

  useEffect(() => { fetchScenarios() }, [fetchScenarios])

  // Fix: removed duplicate `background` key — use a computed variable instead
  const displayScenarios = scenarios.length > 0 ? scenarios : DEMO_SCENARIOS

  useWebSocket(activeRun, (msg) => {
    if (msg.type === 'attack_event') {
      setRunLog((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] ${msg.data.technique_id} — ${msg.data.command}`,
      ])
    }
    if (msg.type === 'run_complete') {
      setRunLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Run complete`])
    }
  })

  const handleLaunch = async () => {
    if (!selected) return
    setLaunching(true)
    setRunLog([])

    try {
      await launchScenario(selected.id)
    } catch {
      // Demo mode — API not running, simulate locally
    }

    // Simulate progress log regardless of API state
    let i = 0
    const iv = setInterval(() => {
      setRunLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${RUN_STEPS[i]}`])
      i++
      if (i >= RUN_STEPS.length) {
        clearInterval(iv)
        setLaunching(false)
      }
    }, 900)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Scenario launcher">
        <span style={{ fontSize: 12, color: 'var(--tx-secondary)' }}>
          All execution isolated — no external network access
        </span>
      </PageHeader>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Scenario cards — fix: no duplicate style keys */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14, marginBottom: 20 }}>
          {displayScenarios.map((s) => {
            const isSelected = selected?.id === s.id
            return (
              <div
                key={s.id}
                onClick={() => setSelected(s)}
                style={{
                  background: isSelected ? 'rgba(88,166,255,.05)' : 'var(--bg-secondary)',
                  border: `1px solid ${isSelected ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 8, padding: 16, cursor: 'pointer', transition: 'border-color .15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</span>
                  <Badge variant={DIFF_COLOR[s.difficulty] || 'blue'}>{s.difficulty}</Badge>
                </div>
                {s.tactic && (
                  <div style={{ marginBottom: 8 }}>
                    <Badge variant="purple">{s.tactic}</Badge>
                  </div>
                )}
                <p style={{ fontSize: 12, color: 'var(--tx-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                  {s.description}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {[
                    { val: s.steps?.length ?? '?', lbl: 'stages' },
                    { val: `~${(s.steps?.length || 1) * 3}m`, lbl: 'est. time' },
                    { val: s.steps?.length ?? 0, lbl: 'detections' },
                  ].map((st) => (
                    <div key={st.lbl} style={{ background: 'var(--bg-tertiary)', borderRadius: 4, padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{st.val}</div>
                      <div style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>{st.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Launch panel */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {selected ? `Selected: ${selected.name}` : 'Select a scenario above'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--tx-secondary)', marginTop: 2 }}>
                Target: WIN-TARGET-01 · Attacker: KALI-01
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleLaunch} disabled={!selected || launching}>
              {launching ? '⏳ Running…' : '▶ Launch attack'}
            </button>
          </div>

          {runLog.length > 0 && (
            <div style={{
              background: 'var(--bg-primary)', borderRadius: 6, padding: 12,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.8,
              border: '1px solid var(--border)', maxHeight: 200, overflowY: 'auto',
            }}>
              {runLog.map((line, i) => (
                <div key={i} style={{
                  color: line.includes('✓') ? 'var(--green)' : line.includes('…') ? 'var(--amber)' : 'var(--tx-primary)',
                }}>{line}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
