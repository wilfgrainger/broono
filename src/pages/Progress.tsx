import { useMemo, useRef, useState } from 'react'
import { Pencil, Printer, Trash2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import ConfirmDialog, { type ConfirmDialogHandle } from '../components/ConfirmDialog'
import WeightChart from '../components/WeightChart'
import { useStore, type WeeklyLog } from '../store'
import { daysBetween, formatShortDate, toLocalISODate } from '../utils/date'
import { formatDose } from '../utils/medications'
import { MILESTONES, bmi, percentChange, symptomCounts, weeklyRate } from '../utils/stats'
import { convertWeight, formatWeight } from '../utils/weight'

// Side effects are summarised over this many recent logs.
const RECENT_LOGS = 8

/** Consecutive injections at the same dose, oldest first: the titration history. */
function doseSteps(logs: WeeklyLog[], fallbackDose: number) {
  const injections = logs.filter((log) => log.site).slice().reverse()
  const steps: { doseMg: number; from: string; to: string; count: number }[] = []
  for (const log of injections) {
    const dose = log.doseMg || fallbackDose
    const last = steps.at(-1)
    if (last && last.doseMg === dose) {
      last.to = log.date
      last.count += 1
    } else {
      steps.push({ doseMg: dose, from: log.date, to: log.date, count: 1 })
    }
  }
  return steps
}

interface ProgressProps {
  onEdit: (logId: string) => void
}

export default function Progress({ onEdit }: ProgressProps) {
  const logs = useStore((s) => s.logs)
  const profile = useStore((s) => s.profile)
  const removeLog = useStore((s) => s.removeLog)
  const deleteDialogRef = useRef<ConfirmDialogHandle>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null)
  const unit = profile.weightUnit
  const canPrint = !Capacitor.isNativePlatform()

  const stats = useMemo(() => {
    const weighIns = logs.filter((log) => log.weight > 0)
    const start = profile.startWeight > 0 ? profile.startWeight : weighIns.at(-1)?.weight ?? 0
    const current = weighIns[0]?.weight ?? start
    const change = start - current
    const percent = percentChange(start, current)
    const rate = weeklyRate(weighIns)
    const currentKg = unit === 'kg' ? current : convertWeight(current, unit, 'kg')
    const firstDate = profile.treatmentStartDate || logs.at(-1)?.date || ''
    const weeks = firstDate ? Math.floor(daysBetween(toLocalISODate(), firstDate) / 7) : null
    return {
      weighIns,
      start,
      current,
      change,
      percent,
      rate,
      bmi: bmi(currentKg, profile.heightCm),
      weeks,
      steps: doseSteps(logs, profile.doseMg),
      symptoms: symptomCounts(logs.slice(0, RECENT_LOGS)),
      recentCount: Math.min(logs.length, RECENT_LOGS),
    }
  }, [logs, profile, unit])

  if (logs.length === 0) {
    return (
      <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">Tracking your journey.</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No logs yet</h2>
          <p className="muted-text">Add your first log to see your trend, dose history and side effects here.</p>
        </div>
      </div>
    )
  }

  const { start, current, change, percent, rate, weighIns, steps, symptoms, recentCount } = stats
  const tiles = [
    { label: 'Start', value: start > 0 ? formatWeight(start, unit) : '--' },
    { label: 'Current', value: current > 0 ? formatWeight(current, unit) : '--' },
    { label: change < 0 ? 'Gained' : 'Lost', value: weighIns.length > 0 ? formatWeight(Math.abs(change), unit) : '--', note: weighIns.length > 0 ? `${Math.abs(percent)}%` : undefined },
    { label: 'Per week', value: rate === null ? '--' : `${rate > 0 ? '+' : ''}${formatWeight(rate, unit)}`, note: rate === null ? 'needs 2 weeks' : 'last 5 weeks' },
    ...(stats.bmi !== null ? [{ label: 'BMI', value: `${stats.bmi}` }] : []),
    ...(stats.weeks !== null ? [{ label: 'Weeks', value: `${stats.weeks}`, note: 'on treatment' }] : []),
  ]

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div className="print-only">
        <p style={{ fontSize: 12 }}>Broono summary · {profile.medicationName}{profile.doseMg ? `, ${formatDose(profile.doseMg)}` : ''} · printed {formatShortDate(toLocalISODate())}</p>
      </div>
      <div>
        <h1 className="page-title">Progress</h1>
        <p className="page-subtitle">
          {weighIns.length === 0
            ? 'Add a weigh-in to see your weight trend.'
            : change > 0
              ? `You're down ${formatWeight(change, unit)} total (${percent}%).`
              : change < 0
                ? `You're up ${formatWeight(Math.abs(change), unit)} since you started.`
                : 'Tracking your journey.'}
        </p>
      </div>

      <div className="stat-grid">
        {tiles.map((tile) => (
          <div key={tile.label} className="card stat-tile">
            <p className="stat-tile-label">{tile.label}</p>
            <p className="stat-tile-value">{tile.value}</p>
            {tile.note ? <p className="stat-tile-note">{tile.note}</p> : null}
          </div>
        ))}
      </div>

      {start > 0 ? (
        <section className="card" aria-labelledby="milestones-title">
          <h2 id="milestones-title" className="section-title">Milestones</h2>
          <ul className="milestones">
            {MILESTONES.map((milestone) => {
              const reached = percent >= milestone
              return (
                <li key={milestone} className={reached ? 'milestone reached' : 'milestone'}>
                  <span aria-hidden="true">{reached ? '✓' : '○'}</span>
                  {milestone}% <span className="visually-hidden">{reached ? 'reached' : 'not reached yet'}</span>
                </li>
              )
            })}
          </ul>
          <p className="muted-text" style={{ marginTop: 12 }}>
            Losing 5% or more of starting weight is linked with meaningful health benefits.
          </p>
        </section>
      ) : null}

      {weighIns.length > 0 ? (
        <section className="card" aria-labelledby="trend-title">
          <h2 id="trend-title" className="section-title">Weight Trend</h2>
          <WeightChart logs={weighIns} unit={unit} startWeight={start} goalWeight={profile.goalWeight} />
        </section>
      ) : null}

      {steps.length > 0 ? (
        <section className="card" aria-labelledby="doses-title">
          <h2 id="doses-title" className="section-title">Dose History</h2>
          <ol className="space-y-4" style={{ listStyle: 'none' }}>
            {steps.slice().reverse().map((step, index) => (
              <li key={`${step.from}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{formatDose(step.doseMg) || 'Dose not recorded'}</span>
                <span className="muted-text" style={{ textAlign: 'right' }}>
                  {step.count} {step.count === 1 ? 'injection' : 'injections'} · {formatShortDate(step.from)}{step.count > 1 ? ` to ${formatShortDate(step.to)}` : ''}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="card" aria-labelledby="symptoms-title">
        <h2 id="symptoms-title" className="section-title">Side Effects</h2>
        {symptoms.length === 0 ? (
          <p className="muted-text">No side effects recorded in your last {recentCount} {recentCount === 1 ? 'log' : 'logs'}.</p>
        ) : (
          <>
            <p className="muted-text" style={{ marginBottom: 14 }}>How often each one appears in your last {recentCount} {recentCount === 1 ? 'log' : 'logs'}.</p>
            <ul className="symptom-bars">
              {symptoms.map(({ symptom, count }) => (
                <li key={symptom} className="symptom-bar">
                  <span>{symptom}</span>
                  <span className="symptom-bar-track" aria-hidden="true">
                    <span className="symptom-bar-fill" style={{ display: 'block', width: `${(count / recentCount) * 100}%` }} />
                  </span>
                  <span style={{ fontWeight: 700 }}>{count}<span className="visually-hidden"> of {recentCount} logs</span></span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {canPrint ? (
        <button type="button" className="btn-secondary no-print" onClick={() => window.print()}>
          <Printer size={18} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 8 }} />
          Print or save a summary for your clinician
        </button>
      ) : null}

      <section aria-labelledby="history-title">
        <h2 id="history-title" className="section-title">History</h2>
        <ul className="space-y-4" style={{ listStyle: 'none' }}>
          {logs.map((log, index) => {
            const previous = logs.slice(index + 1).find((entry) => entry.weight > 0)
            const delta = log.weight > 0 && previous ? log.weight - previous.weight : 0
            const label = `${formatShortDate(log.date)}${log.weight > 0 ? `, ${formatWeight(log.weight, unit)}` : ''}`
            return (
              <li key={log.id} className="card history-item" style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: log.weight > 0 ? 24 : 18, fontWeight: 900, letterSpacing: '-0.5px' }}>
                      {log.weight > 0 ? formatWeight(log.weight, unit) : 'Injection'}
                    </span>
                    {log.weight > 0 && previous ? (
                      <span style={{ fontSize: 12, fontWeight: 700, marginLeft: 4, color: delta < 0 ? 'var(--teal)' : delta > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {delta < 0 ? `down ${formatWeight(Math.abs(delta), unit)}` : delta > 0 ? `up ${formatWeight(delta, unit)}` : 'steady'}
                      </span>
                    ) : null}
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, marginRight: -12, flexShrink: 0 }}>
                    <time dateTime={log.date} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {formatShortDate(log.date)}
                    </time>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Edit log from ${formatShortDate(log.date)}`}
                      onClick={() => onEdit(log.id)}
                    >
                      <Pencil size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Delete log from ${formatShortDate(log.date)}`}
                      onClick={() => {
                        setPendingDelete({ id: log.id, label })
                        deleteDialogRef.current?.open()
                      }}
                    >
                      <Trash2 size={16} color="var(--danger)" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {log.site ? (
                    <span className="chip chip-info">{log.site}{log.doseMg ? ` · ${formatDose(log.doseMg)}` : ''}</span>
                  ) : null}
                  {log.symptoms.map((symptom) => (
                    <span key={symptom} className={symptom === 'None' ? 'chip chip-success' : 'chip chip-danger'}>
                      {symptom === 'None' ? 'No side effects' : symptom}
                    </span>
                  ))}
                </div>
                {log.notes ? (
                  <p className="muted-text" style={{ marginTop: 10, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{log.notes}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>

      <ConfirmDialog
        ref={deleteDialogRef}
        title="Delete this log?"
        description={pendingDelete ? `${pendingDelete.label}. This cannot be undone.` : ''}
        confirmLabel="Delete log"
        cancelLabel="Keep it"
        onConfirm={() => { if (pendingDelete) removeLog(pendingDelete.id) }}
      />
    </div>
  )
}
