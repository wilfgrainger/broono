import { useMemo } from 'react'
import { useStore } from '../store'

export default function Progress() {
  const logs = useStore((s) => s.logs)
  const weightUnit = useStore((s) => s.profile.weightUnit)

  const stats = useMemo(() => {
    if (logs.length === 0) return null

    const weights = logs.map((log) => log.weight)
    const maxWeight = Math.max(...weights) + 3
    const minWeight = Math.min(...weights) - 3
    const range = maxWeight - minWeight
    const startWeight = logs[logs.length - 1].weight
    const currentWeight = logs[0].weight
    const totalLost = startWeight - currentWeight
    const weeksCount = logs.length
    const reversedLogs = [...logs].reverse()

    return { minWeight, range, startWeight, totalLost, weeksCount, reversedLogs }
  }, [logs])

  if (!stats) {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', gap: 12 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>No logs yet</h3>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>Complete your first weekly log to unlock your progress history.</p>
      </div>
    )
  }

  const { minWeight, range, startWeight, totalLost, weeksCount, reversedLogs } = stats

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h2 className="page-title">Progress</h2>
        <p className="page-subtitle">
          {totalLost > 0 ? `You're down ${totalLost.toFixed(1)} ${weightUnit} total.` : 'Tracking your journey.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Start', value: `${startWeight.toFixed(1)}`, unit: weightUnit },
          { label: 'Lost', value: totalLost > 0 ? `-${totalLost.toFixed(1)}` : '0', unit: weightUnit },
          { label: 'Weeks', value: `${weeksCount}`, unit: 'logged' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{stat.unit}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Weight Trend</h3>
        <div
          style={{
            height: 180,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            padding: '0 4px',
          }}
        >
          {reversedLogs.map((log) => {
            const pct = range > 0 ? ((log.weight - minWeight) / range) * 100 : 50
            return (
              <div
                key={log.id}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                title={`${log.weight} ${weightUnit}`}
              >
                <div
                  className="chart-bar"
                  style={{ height: `${Math.max(pct, 8)}%`, alignSelf: 'flex-end', width: '100%' }}
                />
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {log.displayDate.split(' ')[1]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>History</h3>
        <div className="space-y-4">
          {logs.map((log, index) => {
            const prevWeight = logs[index + 1]?.weight
            const delta = prevWeight ? log.weight - prevWeight : 0
            const deltaLabel = delta < 0 ? `down ${Math.abs(delta).toFixed(1)}` : delta > 0 ? `up ${Math.abs(delta).toFixed(1)}` : 'steady'

            return (
              <div key={log.id} className="card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>
                      {log.weight.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{weightUnit}</span>
                    {prevWeight ? (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          marginLeft: 4,
                          color: delta < 0 ? '#14b8a6' : delta > 0 ? '#f43f5e' : '#94a3b8',
                        }}
                      >
                        {deltaLabel}
                      </span>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {log.displayDate}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {log.site ? (
                    <span className="chip" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569', fontSize: 11 }}>
                      {log.site}
                    </span>
                  ) : null}
                  {log.symptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="chip"
                      style={{
                        background: symptom === 'None' ? '#f0fdf4' : '#fff1f2',
                        borderColor: symptom === 'None' ? '#bbf7d0' : '#fecdd3',
                        color: symptom === 'None' ? '#16a34a' : '#e11d48',
                        fontSize: 11,
                      }}
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
                {log.notes ? (
                  <p style={{ fontSize: 13, color: '#64748b', marginTop: 10, lineHeight: 1.5 }}>{log.notes}</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
