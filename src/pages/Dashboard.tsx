import { Beef, Droplets, Minus, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { getDaysUntilNextDose, getMedicationLevel, useStore } from '../store'
import { formatShortDate, toLocalISODate } from '../utils/date'
import { formatWeight } from '../utils/weight'

interface DashboardProps {
  onNavigate: (tab: 'dashboard' | 'checkin' | 'progress' | 'news' | 'journal' | 'profile') => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const profile = useStore((state) => state.profile)
  const logs = useStore((state) => state.logs)
  const dailyWater = useStore((state) => state.dailyWater)
  const dailyProtein = useStore((state) => state.dailyProtein)
  const addWaterGlass = useStore((state) => state.addWaterGlass)
  const removeWaterGlass = useStore((state) => state.removeWaterGlass)
  const addProtein = useStore((state) => state.addProtein)

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning.' : today.getHours() < 18 ? 'Good afternoon.' : 'Good evening.'
  const todayDate = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  const hasLogs = logs.length > 0
  // Measure from the onboarding weight, or from the oldest log when there is none
  // (profiles created before a starting weight was required). Progress does the same.
  const baseline = profile.startWeight > 0 ? profile.startWeight : logs[logs.length - 1]?.weight ?? null
  const currentWeight = logs[0]?.weight ?? baseline
  const totalLost = hasLogs && baseline !== null && currentWeight !== null ? baseline - currentWeight : null
  const currentWeightStr = currentWeight !== null ? formatWeight(currentWeight, profile.weightUnit) : '--'

  // A log with an injection site records an injection; older logs without one
  // are still used when nothing better exists.
  const lastInjection = logs.find((log) => log.site) ?? logs[0]
  const medLevel = getMedicationLevel(lastInjection?.date, profile.medicationName)
  const daysUntilDose = getDaysUntilNextDose(profile.injectionDayOfWeek)
  // `getDaysUntilNextDose` reports a full week on the injection day itself.
  const injectedToday = lastInjection?.site !== '' && lastInjection?.date === toLocalISODate(today)
  const doseLabel = daysUntilDose === 7 ? (injectedToday ? 'Done today' : 'Today') : daysUntilDose === 1 ? 'Tomorrow' : `${daysUntilDose} days`
  const medicationLabel = [profile.medicationName, profile.dose.trim()].filter(Boolean).join(' · ')
  const todayISO = toLocalISODate(today)
  const waterGlasses = dailyWater.date === todayISO ? dailyWater.glasses : 0
  const proteinGrams = dailyProtein.date === todayISO ? dailyProtein.grams : 0
  const waterGoal = Math.max(profile.waterGoalGlasses, 1)
  const proteinGoal = Math.max(profile.proteinGoalG, 1)
  const hasLost = totalLost !== null && totalLost > 0
  const hasGained = totalLost !== null && totalLost < 0
  const weightSummary = totalLost === null
    ? 'Add your first log to start tracking'
    : hasLost
      ? `${formatWeight(totalLost, profile.weightUnit)} down`
      : hasGained
        ? `${formatWeight(Math.abs(totalLost), profile.weightUnit)} up`
        : 'No change yet'

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>
          {todayDate}
        </p>
        <h1 className="page-title">{greeting}</h1>
        <p className="page-subtitle">Everything here is stored on this device.</p>
      </div>

      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Current Weight</p>
        <div>
          <span className="weight-display">{currentWeightStr}</span>
        </div>
        <div className={hasLost ? 'badge-teal' : 'badge-teal badge-neutral'}>
          {hasGained
            ? <TrendingUp size={13} strokeWidth={3} aria-hidden="true" />
            : <TrendingDown size={13} strokeWidth={3} aria-hidden="true" />}
          {weightSummary}
        </div>
      </div>

      <div className="card-gradient">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p id="med-level-label" style={{ fontSize: 12, fontWeight: 600, color: 'rgba(224,242,254,0.95)', marginBottom: 4, letterSpacing: '.5px' }}>
                Estimated Medication Level
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(224,242,254,0.95)', marginBottom: 6 }}>{medicationLabel}</p>
              <p style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
                {medLevel}%
              </p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '10px 16px', textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(224,242,254,0.95)', marginBottom: 2 }}>Next Dose</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{doseLabel}</p>
            </div>
          </div>
          <progress className="progress-bar on-gradient" max={100} value={medLevel} aria-labelledby="med-level-label" />
          <p style={{ fontSize: 11, color: 'rgba(224,242,254,0.9)', marginTop: 14, letterSpacing: '.3px', fontWeight: 500 }}>
            {lastInjection
              ? `A simple estimate counted from your injection logged on ${formatShortDate(lastInjection.date)}. Not a clinical measurement or dosing recommendation.`
              : 'Save a weekly log with the injection site on the day you inject to start this estimate. Not a clinical measurement or dosing recommendation.'}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24 }}>Daily Targets</h2>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span id="protein-label" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
              <span style={{ background: '#fff1f2', borderRadius: 8, padding: 6, display: 'flex' }}>
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
              className="icon-btn"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
              onClick={() => addProtein(-10)}
              disabled={proteinGrams === 0}
              aria-label="Remove 10 grams of protein"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <button type="button" id="add-protein-10-btn" className="water-add-btn" onClick={() => addProtein(10)}>
              + 10g
            </button>
            <button type="button" id="add-protein-25-btn" className="water-add-btn" onClick={() => addProtein(25)}>
              + 25g
            </button>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span id="water-label" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
              <span style={{ background: '#eff6ff', borderRadius: 8, padding: 6, display: 'flex' }}>
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
              className="icon-btn"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
              onClick={removeWaterGlass}
              disabled={waterGlasses === 0}
              aria-label="Remove a glass of water"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <button type="button" id="add-water-glass-btn" className="water-add-btn" onClick={addWaterGlass}>
              + Add glass
            </button>
          </div>
          {waterGlasses >= waterGoal ? (
            <p style={{ fontSize: 12, color: '#15803d', marginTop: 8, fontWeight: 700 }}>Goal reached</p>
          ) : null}
        </div>
      </div>

      <button type="button" onClick={() => onNavigate('checkin')} id="quick-log-btn" className="quick-log-btn">
        <span style={{ textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Log this week</span>
          <span style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>Weight + injection site</span>
        </span>
        <span className="icon-wrap">
          <Plus size={18} color="white" strokeWidth={2.5} aria-hidden="true" />
        </span>
      </button>
    </div>
  )
}
