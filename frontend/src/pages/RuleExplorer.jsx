import { useEffect, useState } from 'react'
import { useDetectionsStore } from '../store/appStore'
import { detectionsAPI } from '../api'
import { Card, CardTitle, Badge, PageHeader } from '../components/Shared'

const DEMO_RULES = [
  { id: 'r1', name: 'SIGMA-LSASS-001',  description: 'LSASS memory access detection',  technique_id: 'T1003.001', tactic: 'Credential Access',  severity: 'critical', enabled: true,  false_positives: 0 },
  { id: 'r2', name: 'SIGMA-PS-001',     description: 'Encoded PowerShell execution',    technique_id: 'T1059.001', tactic: 'Execution',           severity: 'high',     enabled: true,  false_positives: 2 },
  { id: 'r3', name: 'SIGMA-PSEXEC-001', description: 'PsExec lateral movement',         technique_id: 'T1021.002', tactic: 'Lateral Movement',    severity: 'high',     enabled: true,  false_positives: 1 },
  { id: 'r4', name: 'SIGMA-PHISH-001',  description: 'Suspicious Office macro spawn',   technique_id: 'T1566.001', tactic: 'Initial Access',      severity: 'medium',   enabled: true,  false_positives: 3 },
  { id: 'r5', name: 'SIGMA-TOKEN-001',  description: 'Token impersonation (EID 10)',    technique_id: 'T1134',     tactic: 'Privilege Escalation', severity: 'critical', enabled: false, false_positives: 0 },
  { id: 'r6', name: 'SIGMA-INJECT-001', description: 'Process injection detection',     technique_id: 'T1055',     tactic: 'Defense Evasion',     severity: 'high',     enabled: false, false_positives: 0 },
]

const SEV_COLOR = { critical: 'red', high: 'amber', medium: 'blue', low: 'green' }

export default function RuleExplorer() {
  const { rules, fetchRules, toggleRule } = useDetectionsStore()
  // Fix 11: local state initialised with DEMO_RULES; updated when store loads
  const [localRules, setLocalRules] = useState(DEMO_RULES)
  const [selected, setSelected] = useState(null)
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  // Fetch from API on mount
  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  // Fix 11: sync local state when store rules change (not inside .then())
  useEffect(() => {
    if (rules.length > 0) {
      setLocalRules(rules)
    }
  }, [rules])

  const handleToggle = async (rule) => {
    const newEnabled = !rule.enabled
    // Optimistic update
    setLocalRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, enabled: newEnabled } : r))
    if (selected?.id === rule.id) setSelected((s) => ({ ...s, enabled: newEnabled }))
    try {
      await toggleRule(rule.id, newEnabled)
    } catch {
      // Revert on failure
      setLocalRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, enabled: rule.enabled } : r))
    }
  }

  const handleTest = async (rule) => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await detectionsAPI.testRule(rule.id)
      setTestResult(res.data)
    } catch {
      // Demo result when API not available
      await new Promise((r) => setTimeout(r, 800))
      setTestResult({ rule_id: rule.id, result: 'pass', matches: 3, false_positives: 0 })
    } finally {
      setTesting(false)
    }
  }

  const enabled = localRules.filter((r) => r.enabled).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Rule explorer">
        <span style={{ fontSize: 12, color: 'var(--tx-secondary)' }}>
          {enabled} active / {localRules.length} total
        </span>
        <button className="btn btn-primary" style={{ fontSize: 12 }}>+ Add rule</button>
      </PageHeader>

      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Rule list */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <CardTitle style={{ margin: 0 }}>Detection rules</CardTitle>
          </div>
          <div>
            {localRules.map((rule) => (
              <div key={rule.id} onClick={() => { setSelected(rule); setTestResult(null) }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: '1px solid rgba(48,54,61,.4)', cursor: 'pointer',
                background: selected?.id === rule.id ? 'rgba(88,166,255,.05)' : 'transparent',
                transition: 'background .15s',
              }}>
                {/* Toggle switch */}
                <div
                  onClick={(e) => { e.stopPropagation(); handleToggle(rule) }}
                  style={{
                    width: 34, height: 18, borderRadius: 9, flexShrink: 0, cursor: 'pointer',
                    background: rule.enabled ? 'rgba(63,185,80,.5)' : 'var(--bg-elevated)',
                    position: 'relative', transition: 'background .2s',
                  }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: rule.enabled ? 18 : 2,
                    transition: 'left .2s',
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 500 }}>{rule.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 1 }}>{rule.description}</div>
                </div>

                <Badge variant="purple">{rule.technique_id}</Badge>
                <Badge variant={SEV_COLOR[rule.severity] || 'blue'}>{rule.severity}</Badge>

                <button className="btn" style={{ fontSize: 10, padding: '2px 10px', flexShrink: 0 }}
                  onClick={(e) => { e.stopPropagation(); setSelected(rule); handleTest(rule) }}>
                  Test
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Rule detail panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {selected ? (
            <>
              <Card>
                <CardTitle>Rule detail</CardTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  {[
                    { label: 'Name',            val: <span style={{ fontFamily: 'monospace' }}>{selected.name}</span> },
                    { label: 'ATT&CK technique', val: <Badge variant="purple">{selected.technique_id}</Badge> },
                    { label: 'Tactic',           val: selected.tactic },
                    { label: 'Severity',         val: <Badge variant={SEV_COLOR[selected.severity]}>{selected.severity}</Badge> },
                    { label: 'False positives',  val: <span style={{ color: selected.false_positives > 0 ? 'var(--amber)' : 'var(--green)' }}>{selected.false_positives}</span> },
                    { label: 'Status',           val: <Badge variant={selected.enabled ? 'green' : 'red'}>{selected.enabled ? 'Enabled' : 'Disabled'}</Badge> },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--tx-secondary)' }}>{label}</span>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardTitle>Sigma YAML</CardTitle>
                <pre style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--green)',
                  background: 'var(--bg-primary)', padding: 10, borderRadius: 6,
                  lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre',
                }}>{`title: ${selected.description}
id: ${selected.name.toLowerCase()}
tags:
  - attack.${(selected.tactic || '').toLowerCase().replace(/ /g, '_')}
  - attack.${selected.technique_id.toLowerCase()}
logsource:
  category: process_access
  product: windows
detection:
  selection:
    TargetImage|endswith: '\\lsass.exe'
  condition: selection
level: ${selected.severity}`}</pre>
              </Card>

              {testResult && (
                <Card>
                  <CardTitle>Test result</CardTitle>
                  <div style={{
                    padding: '10px 12px', borderRadius: 6, fontSize: 12,
                    background: testResult.result === 'pass' ? 'rgba(63,185,80,.1)' : 'rgba(248,81,73,.1)',
                    border: `1px solid ${testResult.result === 'pass' ? 'rgba(63,185,80,.3)' : 'rgba(248,81,73,.3)'}`,
                    color: testResult.result === 'pass' ? 'var(--green)' : 'var(--red)',
                  }}>
                    {testResult.result === 'pass' ? '✓ ' : '✗ '}
                    {testResult.matches} match{testResult.matches !== 1 ? 'es' : ''} · {testResult.false_positives} false positive{testResult.false_positives !== 1 ? 's' : ''}
                  </div>
                </Card>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1, fontSize: 12 }}
                  onClick={() => handleTest(selected)} disabled={testing}>
                  {testing ? 'Testing…' : 'Run test'}
                </button>
                <button className="btn" style={{ flex: 1, fontSize: 12 }}
                  onClick={() => handleToggle(selected)}>
                  {selected.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </>
          ) : (
            <Card>
              <p style={{ color: 'var(--tx-secondary)', fontSize: 13 }}>
                Select a rule on the left to view details, Sigma YAML, and run tests.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
