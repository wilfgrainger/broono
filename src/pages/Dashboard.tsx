import { Beef, Droplets, Plus, Syringe, TrendingDown, TrendingUp } from 'lucide-react'
import InfoPopover from '../components/InfoPopover'
import LevelChart from '../components/LevelChart'
import { useStore } from '../store'
import type { Tab } from '../tabs'
import { formatShortDate, formatWeekdayDate, toLocalISODate } from '../utils/date'
import { getDoseStatus } from '../utils/medication'
import { MEDICATION_INFO, formatDose } from '../utils/medications'
import { currentLevel } from '../utils/pharmacokinetics'
import { percentChange, suggestNextSite } from '../utils/stats'
import { formatWeight } from '../utils/weight'

interface DashboardProps {
  onNavigate: (tab: Tab) => void
}

const ON_BRAND = 'rgba(224,242,254,0.95)'

export default function Dashboard({ onNavigate }: DashboardProps) {
  const profile = useStore((state) => state.profile)
  const logs = useStore((state) => state.logs)
  const dailyWater = useStore((state) => state.dailyWater)
  const dailyProtein = useStore((state) => state.dailyProtein)
  const addWaterGlass = useStore((state) => state.addWaterGlass)
  const removeWaterGlass = useStore((state) => state.removeWaterGlass)
  const addProtein = useStore((state) => state.addProtein)

  const now = new Date()
  const today = toLocalISODate(now)
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const todayLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  // ── Medication ──
  const info = MEDICATION_INFO[profile.medicationName]
  const injectionLogs = logs.filter((log) => log.site)
  // Older logs have no dose recorded; assume the current dose for the estimate.
  const injections = injectionLogs.map((log) => ({ date: log.date, doseMg: log.doseMg || profile.doseMg }))
  const lastInjection = injectionLogs[0]
  const referenceDose = profile.doseMg || injections[0]?.doseMg || 0
  const level = currentLevel(injections, info.ingredient, today, referenceDose)
  const doseStatus = getDoseStatus(profile.injectionDayOfWeek, lastInjection?.date, today)
  const dueToday = doseStatus.daysUntil === 0
  const nextLabel = dueToday ? 'Today' : doseStatus.daysUntil === 1 ? 'Tomorrow' : formatWeekdayDate(doseStatus.nextDate)
  const medicationLabel = [profile.medicationName, formatDose(profile.doseMg)].filter(Boolean).join(' · ')
  const suggestion = suggestNextSite(injectionLogs)
  // Absorption takes about a day, so straight after a dose the model reads near 0%. Say so instead.
  const levelLabel = level === null ? '' : doseStatus.takenToday && level < 10 ? 'Rising' : `${level}%`

  // ── Weight ── (logs without a weight are injection-only entries)
  const weighIns = logs.filter((log) => log.weight > 0)
  // Measure from the onboarding weight, or from the oldest weigh-in when there is none.
  const baseline = profile.startWeight > 0 ? profile.startWeight : weighIns[weighIns.length - 1]?.weight ?? null
  const currentWeight = weighIns[0]?.weight ?? baseline
  const change = weighIns.length > 0 && baseline !== null && currentWeight !== null ? baseline - currentWeight : null
  const hasLost = change !== null && change > 0
  const hasGained = change !== null && change < 0
  const weightSummary = change === null
    ? 'Add a weigh-in to start your trend'
    : hasLost
      ? `${formatWeight(change, profile.weightUnit)} down · ${percentChange(baseline!, currentWeight!)}%`
      : hasGained
        ? `${formatWeight(Math.abs(change), profile.weightUnit)} up`
        : 'No change yet'
  const goal = profile.goalWeight > 0 && baseline !== null && currentWeight !== null && baseline > profile.goalWeight
    ? { total: baseline - profile.goalWeight, done: Math.min(Math.max(baseline - currentWeight, 0), baseline - profile.goalWeight), remaining: currentWeight - profile.goalWeight }
    : null

  // ── Daily targets ──
  const waterGlasses = dailyWater.date === today ? dailyWater.glasses : 0
  const proteinGrams = dailyProtein.date === today ? dailyProtein.grams : 0
  const waterGoal = Math.max(profile.waterGoalGlasses, 1)
  const proteinGoal = Math.max(profile.proteinGoalG, 1)

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 4 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>{todayLabel}</p>
        <h1 className="page-title">{greeting}</h1>
      </div>

      <div className="dashboard-grid">
        <section className="card-gradient span-all" aria-labelledby="dose-card-title">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <h2 id="dose-card-title" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: ON_BRAND }}>
                  Next dose
                  <InfoPopover label="About the next dose and estimated level" title="About this estimate">
                    <p>
                      The estimated level is a simple model built from the injections you log (the dots on the chart), using the published
                      half-life of {info.ingredient}. The dashed line is the coming week{profile.doseMg > 0 ? ', including your next scheduled dose' : ''}.
                    </p>
                    <p>100% is the usual peak after several weeks on your current dose, so it builds up over your first month.</p>
                    <p><strong>It is not a measurement and not dosing advice.</strong> Always follow your prescriber.</p>
                  </InfoPopover>
                </h2>
                <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1, marginTop: 2 }}>
                  {doseStatus.takenToday ? 'Done today' : nextLabel}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: ON_BRAND, marginTop: 4 }}>
                  {doseStatus.takenToday ? `Next: ${formatWeekdayDate(doseStatus.nextDate)}` : medicationLabel}
                </p>
              </div>
              {level !== null ? (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: '10px 14px', textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: ON_BRAND }}>Est. level</p>
                  <p style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>{levelLabel}</p>
                </div>
              ) : null}
            </div>

            {level !== null ? (
              <div style={{ marginTop: 16 }}>
                <LevelChart
                  injections={injections}
                  ingredient={info.ingredient}
                  today={today}
                  referenceDoseMg={referenceDose}
                  nextDose={profile.doseMg > 0 && !doseStatus.takenToday ? { date: doseStatus.nextDate, doseMg: profile.doseMg } : null}
                  showCaption={false}
                />
              </div>
            ) : (
              <p style={{ fontSize: 14, lineHeight: 1.5, color: ON_BRAND, marginTop: 12 }}>
                {profile.doseMg > 0
                  ? 'Log an injection to see your estimated level build up week by week.'
                  : 'Add your dose in Settings, then log an injection to see your estimated level.'}
              </p>
            )}

            <p style={{ fontSize: 14, fontWeight: 600, marginTop: 14 }}>
              <Syringe size={15} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 6 }} />
              Suggested site: <strong>{suggestion.site}</strong>
              <span style={{ fontWeight: 500, color: ON_BRAND }}>
                {suggestion.lastUsed ? ` · last used ${formatShortDate(suggestion.lastUsed)}` : ' · not used yet'}
              </span>
            </p>

            {!doseStatus.takenToday ? (
              <button type="button" className="dose-card-cta" onClick={() => onNavigate('checkin')}>
                <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
                {dueToday ? 'Log today’s injection' : 'Log an injection'}
              </button>
            ) : null}
          </div>
        </section>

        <section className="card" aria-labelledby="weight-card-title">
          <h2 id="weight-card-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Current weight</h2>
          <p className="weight-display">{currentWeight !== null ? formatWeight(currentWeight, profile.weightUnit) : '--'}</p>
          <p className={hasLost ? 'badge-teal' : 'badge-teal badge-neutral'}>
            {hasGained
              ? <TrendingUp size={13} strokeWidth={3} aria-hidden="true" />
              : <TrendingDown size={13} strokeWidth={3} aria-hidden="true" />}
            {weightSummary}
          </p>
          {goal ? (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <span id="goal-label">Goal {formatWeight(profile.goalWeight, profile.weightUnit)}</span>
                <span>{goal.remaining > 0 ? `${formatWeight(goal.remaining, profile.weightUnit)} to go` : '✓ Goal reached'}</span>
              </div>
              <progress className="progress-bar" style={{ '--progress-fill': 'var(--teal)' } as React.CSSProperties} max={goal.total} value={goal.done} aria-labelledby="goal-label" />
            </div>
          ) : null}
        </section>

        <section className="card" aria-labelledby="targets-title">
          <h2 id="targets-title" style={{ fontSize: 17, fontWeight: 800, marginBottom: 18 }}>Today</h2>

          <div className="target-row">
            <span id="protein-label" className="target-name">
              <span style={{ background: 'var(--danger-soft)', borderRadius: 10, padding: 7, display: 'flex' }}>
                <Beef size={16} color="#f43f5e" strokeWidth={2} aria-hidden="true" />
              </span>
              <span>Protein <span className="target-value">{proteinGrams} / {proteinGoal}g</span></span>
            </span>
            <span className="stepper">
              <button type="button" id="remove-protein-btn" onClick={() => addProtein(-10)} disabled={proteinGrams === 0} aria-label="Remove 10 grams of protein">−</button>
              <button type="button" id="add-protein-10-btn" onClick={() => addProtein(10)}>+ 10g</button>
              <button type="button" id="add-protein-25-btn" className="add" onClick={() => addProtein(25)}>+ 25g</button>
            </span>
            <progress
              className="progress-bar"
              style={{ '--progress-fill': '#fb7185' } as React.CSSProperties}
              max={proteinGoal}
              value={Math.min(proteinGrams, proteinGoal)}
              aria-labelledby="protein-label"
            />
          </div>

          <div className="target-row">
            <span id="water-label" className="target-name">
              <span style={{ background: 'var(--info-soft)', borderRadius: 10, padding: 7, display: 'flex' }}>
                <Droplets size={16} color="#3b82f6" strokeWidth={2} aria-hidden="true" />
              </span>
              <span>Water <span className="target-value">{waterGlasses} / {waterGoal} glasses</span></span>
            </span>
            <span className="stepper">
              <button type="button" id="remove-water-glass-btn" onClick={removeWaterGlass} disabled={waterGlasses === 0} aria-label="Remove a glass of water">−</button>
              <button type="button" id="add-water-glass-btn" className="add" onClick={addWaterGlass}>+ Add glass</button>
            </span>
            <progress
              className="progress-bar"
              style={{ '--progress-fill': '#60a5fa' } as React.CSSProperties}
              max={waterGoal}
              value={Math.min(waterGlasses, waterGoal)}
              aria-labelledby="water-label"
            />
          </div>
          {waterGlasses >= waterGoal ? (
            <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8, fontWeight: 700 }}>✓ Water goal reached</p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
