import { useRef } from 'react'
import { useStore, type MedicationName } from '../store'
import { toLocalISODate } from '../utils/date'
import { getWeightUnitLabel } from '../utils/weight'

const MEDICATIONS: MedicationName[] = ['Zepbound', 'Mounjaro', 'Wegovy', 'Ozempic']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Lets the field be cleared while typing (0 renders as empty) and caps the value at `max`.
function clampGoal(rawValue: string, max: number): number {
  const parsed = Number.parseInt(rawValue, 10)
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), max) : 0
}

export default function ProfilePage() {
  const profile = useStore((state) => state.profile)
  const logs = useStore((state) => state.logs)
  const journalEntries = useStore((state) => state.journalEntries)
  const dailyWater = useStore((state) => state.dailyWater)
  const dailyProtein = useStore((state) => state.dailyProtein)
  const eraseDialogRef = useRef<HTMLDialogElement>(null)
  const updateProfile = useStore((state) => state.updateProfile)
  const resetApp = useStore((state) => state.resetApp)

  const handleExport = () => {
    const dataStr = JSON.stringify({
      exportedAt: new Date().toISOString(),
      profile,
      logs,
      journalEntries,
      dailyWater,
      dailyProtein,
    }, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `broono-export-${toLocalISODate()}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleEraseDialogClose = () => {
    const dialog = eraseDialogRef.current
    if (!dialog) return

    // Esc and the back gesture close the dialog without a value, so only an
    // explicit press of the destructive button erases anything.
    const confirmed = dialog.returnValue === 'erase'
    dialog.returnValue = ''
    if (!confirmed) return

    resetApp()
    window.location.assign('/')
  }

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your local tracker and your data.</p>
      </div>

      <div className="card">
        <h2 id="medication-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Medication</h2>
        <div className="selector-grid" role="group" aria-labelledby="medication-label">
          {MEDICATIONS.map((medication) => (
            <button
              type="button"
              key={medication}
              id={`med-${medication.toLowerCase()}`}
              onClick={() => updateProfile({ medicationName: medication })}
              aria-pressed={profile.medicationName === medication}
              className={`selector-btn ${profile.medicationName === medication ? 'selected' : ''}`}
            >
              {medication}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <label htmlFor="dose-input" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          Current Dose
        </label>
        <input
          id="dose-input"
          name="dose"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={profile.dose}
          onChange={(event) => updateProfile({ dose: event.target.value })}
          placeholder="e.g. 5mg"
          className="form-input"
        />
      </div>

      <div className="card">
        <h2 id="injection-day-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Injection Day</h2>
        <div role="group" aria-labelledby="injection-day-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {DAY_NAMES.map((day, index) => (
            <button
              type="button"
              key={day}
              id={`day-${day.toLowerCase()}`}
              onClick={() => updateProfile({ injectionDayOfWeek: index })}
              aria-pressed={profile.injectionDayOfWeek === index}
              aria-label={day}
              style={{
                padding: '10px 0',
                minHeight: 44,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                background: profile.injectionDayOfWeek === index ? '#0f172a' : '#f8fafc',
                color: profile.injectionDayOfWeek === index ? 'white' : '#475569',
                borderColor: profile.injectionDayOfWeek === index ? '#0f172a' : '#e2e8f0',
              }}
            >
              {day.slice(0, 1)}
            </button>
          ))}
        </div>
        <p aria-hidden="true" style={{ fontSize: 12, color: '#64748b', marginTop: 10, fontWeight: 500 }}>
          Currently: <strong style={{ color: '#334155' }}>{DAY_NAMES[profile.injectionDayOfWeek]}</strong>
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Daily Goals</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="protein-goal" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
              Protein Goal (g)
            </label>
            <input
              id="protein-goal"
              name="proteinGoal"
              type="number"
              inputMode="numeric"
              value={profile.proteinGoalG || ''}
              onChange={(event) => updateProfile({ proteinGoalG: clampGoal(event.target.value, 300) })}
              onBlur={() => { if (profile.proteinGoalG < 30) updateProfile({ proteinGoalG: 30 }) }}
              min="30"
              max="300"
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="water-goal" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
              Water Goal (glasses)
            </label>
            <input
              id="water-goal"
              name="waterGoal"
              type="number"
              inputMode="numeric"
              value={profile.waterGoalGlasses || ''}
              onChange={(event) => updateProfile({ waterGoalGlasses: clampGoal(event.target.value, 20) })}
              onBlur={() => { if (profile.waterGoalGlasses < 1) updateProfile({ waterGoalGlasses: 1 }) }}
              min="1"
              max="20"
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 id="weight-unit-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Weight Unit</h2>
        <div role="group" aria-labelledby="weight-unit-label" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(['lbs', 'kg'] as const).map((unit) => (
            <button
              type="button"
              key={unit}
              id={`unit-${unit}`}
              onClick={() => updateProfile({ weightUnit: unit })}
              aria-pressed={profile.weightUnit === unit}
              className={`selector-btn ${profile.weightUnit === unit ? 'selected' : ''}`}
            >
              {getWeightUnitLabel(unit)}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ background: '#f8fafc' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Local data only</h2>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          Broono has no account or cloud database. Your profile, logs and journal remain in this browser or app installation. Export a copy before clearing browser/app data or changing devices.
        </p>
      </div>

      <button type="button" id="export-btn" onClick={handleExport} className="btn-primary">
        Export my local data
      </button>

      <button
        type="button"
        id="delete-account-btn"
        onClick={() => eraseDialogRef.current?.showModal()}
        style={{
          width: '100%',
          background: 'white',
          color: '#be123c',
          border: '1px solid #fecdd3',
          borderRadius: 'var(--radius-card)',
          fontFamily: 'inherit',
          fontSize: 15,
          fontWeight: 700,
          padding: '18px 24px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        Erase data from this device
      </button>

      <dialog
        ref={eraseDialogRef}
        id="erase-dialog"
        className="confirm-dialog"
        aria-labelledby="erase-dialog-title"
        aria-describedby="erase-dialog-description"
        onClose={handleEraseDialogClose}
      >
        <h2 id="erase-dialog-title">Erase all Broono data?</h2>
        <p id="erase-dialog-description">
          This removes your profile, logs and journal entries from this device. It cannot be undone unless you exported a backup.
        </p>
        <form method="dialog">
          <button value="cancel" autoFocus>Keep my data</button>
          <button value="erase">Erase everything</button>
        </form>
      </dialog>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', paddingBottom: 8, marginTop: 16 }}>
        Broono local edition — no account, sync or remote backup.
      </p>
      <div style={{ textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', paddingBottom: 24 }}>
        <a href="/privacy" style={{ fontSize: 13, color: '#475569', textDecoration: 'underline', padding: '12px 4px' }}>Privacy Policy</a>
        <a href="/terms" style={{ fontSize: 13, color: '#475569', textDecoration: 'underline', padding: '12px 4px' }}>Terms of Service</a>
      </div>
    </div>
  )
}
