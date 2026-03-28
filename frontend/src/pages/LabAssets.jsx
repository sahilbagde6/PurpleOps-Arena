import { useState } from 'react'
import { Card, CardTitle, Badge, Dot, PageHeader } from '../components/Shared'

const MACHINES = [
  {
    id: 'win-01', name: 'WIN-TARGET-01', os: 'Windows 10', ip: '10.0.0.10',
    status: 'isolated', cpu: 34, ram: 2.1, ramMax: 4,
    agents: ['Sysmon · active', 'Wazuh · active'],
  },
  {
    id: 'linux-01', name: 'LINUX-TARGET-01', os: 'Ubuntu 22.04', ip: '10.0.0.20',
    status: 'online', cpu: 8, ram: 0.5, ramMax: 2,
    agents: ['Auditd · active', 'Wazuh · active'],
  },
  {
    id: 'kali-01', name: 'KALI-ATTACKER', os: 'Kali Linux', ip: '10.0.0.99',
    status: 'attack', cpu: 22, ram: 1.2, ramMax: 4,
    agents: ['Caldera agent · active'],
  },
]

const STATUS_BADGE = {
  online:   { variant: 'green',  label: 'Online' },
  isolated: { variant: 'red',    label: 'Isolated' },
  attack:   { variant: 'blue',   label: 'Attack node' },
  offline:  { variant: 'amber',  label: 'Offline' },
}

function PctBar({ value, color }) {
  return (
    <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 2, transition: 'width .4s' }} />
    </div>
  )
}

export default function LabAssets() {
  const [machines, setMachines] = useState(MACHINES)

  const isolate = (id) => {
    setMachines((prev) => prev.map((m) => m.id === id ? { ...m, status: 'isolated' } : m))
  }

  const restore = (id) => {
    setMachines((prev) => prev.map((m) => m.id === id ? { ...m, status: 'online' } : m))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader title="Lab assets">
        <Dot color="green" />
        <span style={{ fontSize: 12, color: 'var(--green)' }}>Lab network: online</span>
        <Badge variant="red">Egress: BLOCKED</Badge>
      </PageHeader>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Machine cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16, marginBottom: 20 }}>
          {machines.map((m) => {
            const badge = STATUS_BADGE[m.status]
            return (
              <Card key={m.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2 }}>
                      {m.os} · {m.ip}
                    </div>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>

                {/* Resource bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx-secondary)', marginBottom: 3 }}>
                      <span>CPU</span><span>{m.cpu}%</span>
                    </div>
                    <PctBar value={m.cpu} color={m.cpu > 80 ? 'var(--red)' : m.cpu > 50 ? 'var(--amber)' : 'var(--green)'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--tx-secondary)', marginBottom: 3 }}>
                      <span>RAM</span><span>{m.ram}GB / {m.ramMax}GB</span>
                    </div>
                    <PctBar value={(m.ram / m.ramMax) * 100} color="var(--blue)" />
                  </div>
                </div>

                {/* Agents */}
                <div style={{ marginBottom: 14 }}>
                  {m.agents.map((a) => (
                    <div key={a} style={{ fontSize: 11, color: 'var(--tx-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Dot color="green" />{a}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {m.status === 'isolated' ? (
                    <button className="btn" style={{ fontSize: 11, flex: 1 }} onClick={() => restore(m.id)}>Restore</button>
                  ) : (
                    <button className="btn btn-danger" style={{ fontSize: 11, flex: 1 }} onClick={() => isolate(m.id)}>Isolate</button>
                  )}
                  <button className="btn" style={{ fontSize: 11, flex: 1 }}>Console</button>
                  <button className="btn" style={{ fontSize: 11, flex: 1 }}>Reset</button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Network topology */}
        <Card>
          <CardTitle>Network topology</CardTitle>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
            background: 'var(--bg-primary)', padding: 16, borderRadius: 6,
            color: 'var(--tx-secondary)', lineHeight: 2.2,
          }}>
            <div>
              <span style={{ color: 'var(--blue)' }}>[KALI-ATTACKER · 10.0.0.99]</span>
              <span>  ─── </span>
              <span style={{ color: 'var(--tx-muted)' }}>10.0.0.0/24 isolated VLAN</span>
              <span>  ───  </span>
              <span style={{ color: 'var(--amber)' }}>[WIN-TARGET-01 · 10.0.0.10]</span>
              <span> </span>
              <span style={{ color: 'var(--red)' }}>[ISOLATED]</span>
            </div>
            <div style={{ paddingLeft: 40 }}>
              <span>└──  </span>
              <span style={{ color: 'var(--green)' }}>[LINUX-TARGET-01 · 10.0.0.20]</span>
            </div>
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <span style={{ color: 'var(--tx-muted)' }}>Firewall:</span>
              <span style={{ color: 'var(--green)' }}> EGRESS BLOCK</span>
              <span style={{ color: 'var(--tx-muted)' }}>  ·  All outbound to internet: </span>
              <span style={{ color: 'var(--red)' }}>DENY</span>
            </div>
            <div>
              <span style={{ color: 'var(--tx-muted)' }}>Network tap:</span>
              <span style={{ color: 'var(--green)' }}> Zeek + Suricata</span>
              <span style={{ color: 'var(--tx-muted)' }}>  ·  Mirror on eth0</span>
            </div>
            <div>
              <span style={{ color: 'var(--tx-muted)' }}>Sysmon:</span>
              <span style={{ color: 'var(--green)' }}> active on all Windows hosts</span>
              <span style={{ color: 'var(--tx-muted)' }}>  ·  EID 1, 3, 7, 10, 11, 12, 13 enabled</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 }}>
            {[
              { val: '3', lbl: 'Lab machines', color: 'var(--blue)' },
              { val: '2', lbl: 'Agents active', color: 'var(--green)' },
              { val: '0', lbl: 'External connections', color: 'var(--green)' },
              { val: '1', lbl: 'Hosts isolated', color: 'var(--red)' },
            ].map((s) => (
              <div key={s.lbl} style={{
                background: 'var(--bg-tertiary)', borderRadius: 6,
                padding: '10px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--tx-secondary)', marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
