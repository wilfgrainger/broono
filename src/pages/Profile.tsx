import { useStore, type MedicationName } from '../store'
import { getWeightUnitLabel } from '../utils/weight'

const MEDICATIONS: MedicationName[] = ['Zepbound', 'Mounjaro', 'Wegovy', 'Ozempic']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ProfilePage() {
  const profile = useStore((state) => state.profile)
  const logs = useStore((state) => state.logs)
  const journalEntries = useStore((state) => state.journalEntries)
  const dailyWater = useStore((state) => state.dailyWater)
  const updateProfile = useStore((state) => state.updateProfile)
  const resetApp = useStore((state) => state.resetApp)

  const handleExport = () => {
    const dataStr = JSON.stringify({
      exportedAt: new Date().toISOString(),
      profile,
      logs,
      journalEntries,
      dailyWater,
    }, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `broono-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleEraseLocalData = () => {
    const confirmed = window.confirm(
      'Erase all Broono data from this device? This removes your profile, logs and journal entries and cannot be undone unless you exported a backup.',
    )

    if (!confirmed) return

    resetApp()
    window.location.assign('/')
  }

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Manage your local tracker and your data.</p>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Medication</p>
        <div className="selector-grid">
          {MEDICATIONS.map((medication) => (
            <button
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
          type="text"
          value={profile.dose}
          onChange={(event) => updateProfile({ dose: event.target.value })}
          placeholder="e.g. 5mg"
          className="form-input"
        />
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Injection Day</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {DAY_NAMES.map((day, index) => (
            <button
              key={day}
              id={`day-${day.toLowerCase()}`}
              onClick={() => updateProfile({ injectionDayOfWeek: index })}
              aria-pressed={profile.injectionDayOfWeek === index}
              style={{
                padding: '10px 0',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                background: profile.injectionDayOfWeek === index ? '#0f172a' : '#f8fafc',
                color: profile.injectionDayOfWeek === index ? 'white' : '#64748b',
                borderColor: profile.injectionDayOfWeek === index ? '#0f172a' : '#e2e8f0',
              }}
            >
              {day.slice(0, 1)}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10, fontWeight: 500 }}>
          Currently: <strong style={{ color: '#334155' }}>{DAY_NAMES[profile.injectionDayOfWeek]}</strong>
        </p>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Daily Goals</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="protein-goal" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
              Protein Goal (g)
            </label>
            <input
              id="protein-goal"
              type="number"
              value={profile.proteinGoalG}
              onChange={(event) => updateProfile({ proteinGoalG: Number.parseInt(event.target.value, 10) || 100 })}
              min="50"
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
              type="number"
              value={profile.waterGoalGlasses}
              onChange={(event) => updateProfile({ waterGoalGlasses: Number.parseInt(event.target.value, 10) || 8 })}
              min="4"
              max="20"
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Weight Unit</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(['lbs', 'kg'] as const).map((unit) => (
            <button
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
        <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Local data only</p>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          Broono has no account or cloud database. Your profile, logs and journal remain in this browser or app installation. Export a copy before clearing browser/app data or changing devices.
        </p>
      </div>

      <button id="export-btn" onClick={handleExport} className="btn-primary">
        Export my local data
      </button>

      <button
        id="delete-account-btn"
        onClick={handleEraseLocalData}
        style={{
          width: '100%',
          background: 'white',
          color: '#e11d48',
          border: '1px solid #fecdd3',
          borderRadius: 'var(--radius-card)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 15,
          fontWeight: 700,
          padding: '18px 24px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        Erase data from this device
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', paddingBottom: 8, marginTop: 16 }}>
        Broono local edition — no account, sync or remote backup.
      </p>
      <div style={{ textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', paddingBottom: 24 }}>
        <a href="/privacy" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'underline' }}>Privacy Policy</a>
        <a href="/terms" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'underline' }}>Terms of Service</a>
      </div>
    </div>
  )
}
