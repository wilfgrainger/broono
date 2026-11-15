import { useMemo } from 'react'
import { useStore } from '../store'
import { formatDayOfMonth, formatShortDate } from '../utils/date'
import { formatWeight } from '../utils/weight'

// Enough history to read a trend while keeping each bar wide enough to tap and label.
const CHART_LOG_LIMIT = 12

export default function Progress() {
  const logs = useStore((s) => s.logs)
  const weightUnit = useStore((s) => s.profile.weightUnit)
  const profileStartWeight = useStore((s) => s.profile.startWeight)

  const stats = useMemo(() => {
    if (logs.length === 0) return null

    const chartLogs = logs.slice(0, CHART_LOG_LIMIT).reverse()
    const weights = chartLogs.map((log) => log.weight)
    const maxWeight = Math.max(...weights) + 3
    const minWeight = Math.min(...weights) - 3
    const range = maxWeight - minWeight
    // Match the dashboard: measure from the onboarding weight when there is one.
    const startWeight = profileStartWeight > 0 ? profileStartWeight : logs[logs.length - 1].weight
    const currentWeight = logs[0].weight
    const totalLost = startWeight - currentWeight
    const weeksCount = logs.length

    return { minWeight, range, startWeight, totalLost, weeksCount, chartLogs }
  }, [logs, profileStartWeight])

  if (!stats) {
    return (
      <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">Tracking your journey.</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No logs yet</h2>
          <p style={{ fontSize: 14, color: '#64748b' }}>Complete your first weekly log to unlock your progress history.</p>
        </div>
      </div>
    )
  }

  const { minWeight, range, startWeight, totalLost, weeksCount, chartLogs } = stats
  const chartSummary = `Weight for the last ${chartLogs.length} ${chartLogs.length === 1 ? 'log' : 'logs'}, oldest first: ${chartLogs
    .map((log) => `${formatShortDate(log.date)} ${formatWeight(log.weight, weightUnit)}`)
    .join(', ')}.`

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h1 className="page-title">Progress</h1>
        <p className="page-subtitle">
          {totalLost > 0 ? `You're down ${formatWeight(totalLost, weightUnit)} total.` : 'Tracking your journey.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Start', value: formatWeight(startWeight, weightUnit), unit: '' },
          { label: 'Lost', value: formatWeight(Math.max(totalLost, 0), weightUnit), unit: '' },
          { label: 'Logs', value: `${weeksCount}`, unit: 'saved' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {stat.value}
            </p>
            {stat.unit ? <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{stat.unit}</p> : null}
          </div>
        ))}
      </div>

      <figure className="card">
        <figcaption>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Weight Trend</h2>
        </figcaption>
        <div
          role="img"
          aria-label={chartSummary}
          style={{
            height: 180,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            padding: '0 4px',
          }}
        >
          {chartLogs.map((log) => {
            const pct = range > 0 ? ((log.weight - minWeight) / range) * 100 : 50
            return (
              <div
                key={log.id}
                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}
                title={`${formatShortDate(log.date)}: ${formatWeight(log.weight, weightUnit)}`}
              >
                <div
                  className="chart-bar"
                  style={{ flexBasis: `${Math.max(pct, 8)}%`, flexShrink: 1, minHeight: 0, width: '100%' }}
                />
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatDayOfMonth(log.date)}
                </span>
              </div>
            )
          })}
        </div>
      </figure>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>History</h2>
        <ul className="space-y-4" style={{ listStyle: 'none' }}>
          {logs.map((log, index) => {
            const prevWeight = logs[index + 1]?.weight
            const delta = prevWeight ? log.weight - prevWeight : 0
            const deltaLabel = delta < 0
              ? `down ${formatWeight(Math.abs(delta), weightUnit)}`
              : delta > 0
                ? `up ${formatWeight(Math.abs(delta), weightUnit)}`
                : 'steady'

            return (
              <li key={log.id} className="card" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>
                      {formatWeight(log.weight, weightUnit)}
                    </span>
                    {prevWeight ? (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          marginLeft: 4,
                          color: delta < 0 ? '#0f766e' : delta > 0 ? '#be123c' : '#64748b',
                        }}
                      >
                        {deltaLabel}
                      </span>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    <time dateTime={log.date}>{formatShortDate(log.date)}</time>
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
                        color: symptom === 'None' ? '#15803d' : '#be123c',
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
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
