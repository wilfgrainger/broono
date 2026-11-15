import { Beef, Droplets, Minus, Plus, Syringe, TrendingDown, TrendingUp } from 'lucide-react'
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
  const greeting = now.getHours() < 12 ? 'Good morning.' : now.getHours() < 18 ? 'Good afternoon.' : 'Good evening.'
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
  const nextLabel = doseStatus.daysUntil === 0 ? 'Today' : doseStatus.daysUntil === 1 ? 'Tomorrow' : formatWeekdayDate(doseStatus.nextDate)
  const medicationLabel = [profile.medicationName, formatDose(profile.doseMg)].filter(Boolean).join(' · ')
  const suggestion = suggestNextSite(injectionLogs)

  // ── Weight ── (logs without a weight are injection-only entries)
  const weighIns = logs.filter((log) => log.weight > 0)
  // Measure from the onboarding weight, or from the oldest weigh-in when there is none.
  const baseline = profile.startWeight > 0 ? profile.startWeight : weighIns[weighIns.length - 1]?.weight ?? null
  const currentWeight = weighIns[0]?.weight ?? baseline
  const change = weighIns.length > 0 && baseline !== null && currentWeight !== null ? baseline - currentWeight : null
  const hasLost = change !== null && change > 0
  const hasGained = change !== null && change < 0
  const weightSummary = change === null
    ? 'Add your first weigh-in to start tracking'
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
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
          {todayLabel}
        </p>
        <h1 className="page-title">{greeting}</h1>
        <p className="page-subtitle">Everything here is stored on this device.</p>
      </div>

      <section className="card-gradient" aria-labelledby="dose-card-title">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h2 id="dose-card-title" style={{ fontSize: 12, fontWeight: 600, color: 'rgba(224,242,254,0.95)', letterSpacing: '.5px' }}>
                Next dose
              </h2>
              <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.15, marginTop: 2 }}>
                {doseStatus.takenToday ? 'Done today' : nextLabel}
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(224,242,254,0.95)', marginTop: 4 }}>
                {doseStatus.takenToday ? `Next: ${formatWeekdayDate(doseStatus.nextDate)}` : medicationLabel}
              </p>
            </div>
            {level !== null ? (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '10px 14px', textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(224,242,254,0.95)', marginBottom: 2 }}>Est. level</p>
                <p style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.1 }}>{level}%</p>
              </div>
            ) : null}
          </div>

          {level !== null ? (
            <div style={{ marginTop: 18 }}>
              <LevelChart
                injections={injections}
                ingredient={info.ingredient}
                today={today}
                referenceDoseMg={referenceDose}
                nextDose={profile.doseMg > 0 && !doseStatus.takenToday ? { date: doseStatus.nextDate, doseMg: profile.doseMg } : null}
              />
            </div>
          ) : (
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'rgba(224,242,254,0.95)', marginTop: 14 }}>
              {profile.doseMg > 0
                ? 'Log an injection to see your estimated medication level build up week by week.'
                : 'Add your dose in Settings, then log an injection to see your estimated medication level.'}
            </p>
          )}

          <p style={{ fontSize: 13, fontWeight: 600, marginTop: 14 }}>
            <Syringe size={14} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Suggested site: <strong>{suggestion.site}</strong>
            <span style={{ fontWeight: 500, color: 'rgba(224,242,254,0.95)' }}>
              {suggestion.lastUsed ? ` (last used ${formatShortDate(suggestion.lastUsed)})` : ' (not used yet)'}
            </span>
          </p>
          <p style={{ fontSize: 11, color: 'rgba(224,242,254,0.95)', marginTop: 10, lineHeight: 1.5 }}>
            Estimates are a simple model for personal context, not a measurement or dosing advice.
          </p>
        </div>
      </section>

      <section className="card" aria-labelledby="weight-card-title">
        <h2 id="weight-card-title" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Current Weight</h2>
        <p className="weight-display">{currentWeight !== null ? formatWeight(currentWeight, profile.weightUnit) : '--'}</p>
        <p className={hasLost ? 'badge-teal' : 'badge-teal badge-neutral'}>
          {hasGained
            ? <TrendingUp size={13} strokeWidth={3} aria-hidden="true" />
            : <TrendingDown size={13} strokeWidth={3} aria-hidden="true" />}
          {weightSummary}
        </p>
        {goal ? (
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              <span id="goal-label">Goal {formatWeight(profile.goalWeight, profile.weightUnit)}</span>
              <span>{goal.remaining > 0 ? `${formatWeight(goal.remaining, profile.weightUnit)} to go` : 'Goal reached'}</span>
            </div>
            <progress className="progress-bar" style={{ '--progress-fill': 'var(--teal)' } as React.CSSProperties} max={goal.total} value={goal.done} aria-labelledby="goal-label" />
          </div>
        ) : null}
      </section>

      <section className="card" aria-labelledby="targets-title">
        <h2 id="targets-title" style={{ fontSize: 17, fontWeight: 800, marginBottom: 24 }}>Daily Targets</h2>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span id="protein-label" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
              <span style={{ background: 'var(--danger-soft)', borderRadius: 8, padding: 6, display: 'flex' }}>
                <Beef size={15} color="#f43f5e" strokeWidth={2} aria-hidden="true" />
              </span>
              Protein
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
              {proteinGrams} / {proteinGoal}g
            </span>
          </div>
          <progress
            className="progress-bar"
            style={{ '--progress-fill': '#fb7185' } as React.CSSProperties}
            max={proteinGoal}
            value={Math.min(proteinGrams, proteinGoal)}
            aria-labelledby="protein-label"
          />
          <div className="stat-row">
            <button
              type="button"
              id="remove-protein-btn"
              className="water-add-btn"
              style={{ width: 48, flex: '0 0 48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              onClick={() => addProtein(-10)}
              disabled={proteinGrams === 0}
              aria-label="Remove 10 grams of protein"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <button type="button" id="add-protein-10-btn" className="water-add-btn" onClick={() => addProtein(10)}>+ 10g</button>
            <button type="button" id="add-protein-25-btn" className="water-add-btn" onClick={() => addProtein(25)}>+ 25g</button>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span id="water-label" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
              <span style={{ background: 'var(--info-soft)', borderRadius: 8, padding: 6, display: 'flex' }}>
                <Droplets size={15} color="#3b82f6" strokeWidth={2} aria-hidden="true" />
              </span>
              Water
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
              {waterGlasses} / {waterGoal} glasses
            </span>
          </div>
          <progress
            className="progress-bar"
            style={{ '--progress-fill': '#60a5fa' } as React.CSSProperties}
            max={waterGoal}
            value={Math.min(waterGlasses, waterGoal)}
            aria-labelledby="water-label"
          />
          <div className="stat-row">
            <button
              type="button"
              id="remove-water-glass-btn"
              className="water-add-btn"
              style={{ width: 48, flex: '0 0 48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              onClick={removeWaterGlass}
              disabled={waterGlasses === 0}
              aria-label="Remove a glass of water"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <button type="button" id="add-water-glass-btn" className="water-add-btn" onClick={addWaterGlass}>+ Add glass</button>
          </div>
          {waterGlasses >= waterGoal ? (
            <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8, fontWeight: 700 }}>✓ Goal reached</p>
          ) : null}
        </div>
      </section>

      <button type="button" onClick={() => onNavigate('checkin')} id="quick-log-btn" className="quick-log-btn">
        <span style={{ textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {doseStatus.daysUntil === 0 && !doseStatus.takenToday ? 'Log today’s injection' : 'Add a log'}
          </span>
          <span style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>Injection, weight and side effects</span>
        </span>
        <span className="icon-wrap">
          <Plus size={18} color="currentColor" strokeWidth={2.5} aria-hidden="true" />
        </span>
      </button>
    </div>
  )
}
