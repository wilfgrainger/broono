import { useRef, useState } from 'react'
import ConfirmDialog, { type ConfirmDialogHandle } from '../components/ConfirmDialog'
import { LIMITS, MEDICATIONS, STORE_VERSION, sanitizePersistedState, useStore, type PersistedAppState } from '../store'
import { saveBackupFile } from '../utils/backupFile'
import { toLocalISODate } from '../utils/date'
import { WEIGHT_UNIT_OPTIONS } from '../utils/weight'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MAX_IMPORT_BYTES = 5 * 1024 * 1024

interface GoalInputProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  onCommit: (value: number) => void
}

// Keeps what the user is typing as a local draft, so the field can be cleared and
// retyped, and only ever writes an in-range whole number to the store.
function GoalInput({ id, label, value, min, max, onCommit }: GoalInputProps) {
  const [draft, setDraft] = useState(`${value}`)
  const hintId = `${id}-hint`

  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="numeric"
        className="form-input"
        min={min}
        max={max}
        step="1"
        value={draft}
        aria-describedby={hintId}
        onChange={(event) => {
          setDraft(event.target.value)
          const parsed = Number(event.target.value)
          if (Number.isInteger(parsed) && parsed >= min && parsed <= max) onCommit(parsed)
        }}
        onBlur={() => setDraft(`${value}`)}
      />
      <p id={hintId} style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Between {min} and {max}.</p>
    </div>
  )
}

export default function ProfilePage() {
  const profile = useStore((state) => state.profile)
  const updateProfile = useStore((state) => state.updateProfile)
  const setWeightUnit = useStore((state) => state.setWeightUnit)
  const importData = useStore((state) => state.importData)
  const resetApp = useStore((state) => state.resetApp)

  const eraseDialogRef = useRef<ConfirmDialogHandle>(null)
  const importDialogRef = useRef<ConfirmDialogHandle>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<PersistedAppState | null>(null)
  const [dataMessage, setDataMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const handleExport = async () => {
    // Read the latest state at click time rather than subscribing this page to every change.
    const { profile: currentProfile, logs, journalEntries, dailyWater, dailyProtein } = useStore.getState()
    const dataStr = JSON.stringify({
      app: 'broono',
      formatVersion: STORE_VERSION,
      exportedAt: new Date().toISOString(),
      profile: currentProfile,
      logs,
      journalEntries,
      dailyWater,
      dailyProtein,
    }, null, 2)

    try {
      const result = await saveBackupFile(dataStr, `broono-export-${toLocalISODate()}.json`)
      setDataMessage(result === 'cancelled'
        ? null
        : { tone: 'ok', text: result === 'shared' ? 'Backup file created.' : 'Backup file created. Check your downloads.' })
    } catch {
      setDataMessage({ tone: 'error', text: 'The backup file could not be created. Please try again.' })
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Allow choosing the same file again after an error.
    event.target.value = ''
    if (!file) return

    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('too large')
      const parsed: unknown = JSON.parse(await file.text())
      const version = typeof (parsed as { formatVersion?: unknown })?.formatVersion === 'number'
        ? (parsed as { formatVersion: number }).formatVersion
        : 0
      const data = sanitizePersistedState(parsed, version)
      if (!data) throw new Error('not a backup')

      setPendingImport(data)
      importDialogRef.current?.open()
    } catch {
      setDataMessage({ tone: 'error', text: 'That file is not a Broono backup. Choose a file exported from Broono.' })
    }
  }

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Changes are saved as you make them.</p>
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
          maxLength={LIMITS.dose}
          value={profile.dose}
          onChange={(event) => updateProfile({ dose: event.target.value })}
          placeholder="e.g. 5mg"
          className="form-input"
        />
      </div>

      <div className="card">
        <h2 id="injection-day-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Injection Day</h2>
        <div role="group" aria-labelledby="injection-day-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {DAY_NAMES.map((day, index) => {
            const selected = profile.injectionDayOfWeek === index
            return (
              <button
                type="button"
                key={day}
                id={`day-${day.toLowerCase()}`}
                onClick={() => updateProfile({ injectionDayOfWeek: index })}
                aria-pressed={selected}
                aria-label={day}
                style={{
                  padding: '10px 0',
                  minHeight: 44,
                  borderRadius: 10,
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  background: selected ? '#0f172a' : '#f8fafc',
                  color: selected ? 'white' : '#475569',
                  borderColor: selected ? '#0f172a' : 'var(--border-strong)',
                }}
              >
                {day.slice(0, 2)}
              </button>
            )
          })}
        </div>
        <p aria-hidden="true" style={{ fontSize: 12, color: '#64748b', marginTop: 10, fontWeight: 500 }}>
          Currently: <strong style={{ color: '#334155' }}>{DAY_NAMES[profile.injectionDayOfWeek]}</strong>
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Daily Goals</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <GoalInput
            id="protein-goal"
            label="Protein Goal (g)"
            value={profile.proteinGoalG}
            min={LIMITS.proteinGoal.min}
            max={LIMITS.proteinGoal.max}
            onCommit={(proteinGoalG) => updateProfile({ proteinGoalG })}
          />
          <GoalInput
            id="water-goal"
            label="Water Goal (glasses)"
            value={profile.waterGoalGlasses}
            min={LIMITS.waterGoal.min}
            max={LIMITS.waterGoal.max}
            onCommit={(waterGoalGlasses) => updateProfile({ waterGoalGlasses })}
          />
        </div>
      </div>

      <div className="card">
        <h2 id="weight-unit-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Weight Unit</h2>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Your saved weights are converted when you change unit.</p>
        <div role="group" aria-labelledby="weight-unit-label" style={{ display: 'grid', gap: 10 }}>
          {WEIGHT_UNIT_OPTIONS.map(({ unit, label }) => (
            <button
              type="button"
              key={unit}
              id={`unit-${unit}`}
              onClick={() => setWeightUnit(unit)}
              aria-pressed={profile.weightUnit === unit}
              className={`selector-btn ${profile.weightUnit === unit ? 'selected' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ background: '#f8fafc' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Your data</h2>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
          Broono has no account or cloud database. Your profile, logs and journal stay in this browser or app installation. Export a backup before clearing browser or app data or changing devices, and import it to restore.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button type="button" id="export-btn" onClick={() => void handleExport()} className="btn-primary">
            Export my local data
          </button>
          <button type="button" id="import-btn" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
            Import a backup
          </button>
          <input
            ref={fileInputRef}
            id="import-file-input"
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            hidden
          />
        </div>
        {/* Always mounted so the result of an export or import is announced. */}
        <p
          role="status"
          style={{ fontSize: 13, fontWeight: 600, marginTop: dataMessage ? 12 : 0, color: dataMessage?.tone === 'error' ? '#be123c' : '#15803d' }}
        >
          {dataMessage?.text}
        </p>
      </div>

      <button type="button" id="delete-account-btn" onClick={() => eraseDialogRef.current?.open()} className="btn-danger">
        Erase data from this device
      </button>

      <ConfirmDialog
        ref={eraseDialogRef}
        title="Erase all Broono data?"
        description="This removes your profile, logs and journal entries from this device. It cannot be undone unless you exported a backup."
        confirmLabel="Erase everything"
        cancelLabel="Keep my data"
        onConfirm={() => {
          resetApp()
          window.location.assign('/')
        }}
      />

      <ConfirmDialog
        ref={importDialogRef}
        title="Replace your data with this backup?"
        description={pendingImport
          ? `The backup has ${pendingImport.logs.length} weekly ${pendingImport.logs.length === 1 ? 'log' : 'logs'} and ${pendingImport.journalEntries.length} journal ${pendingImport.journalEntries.length === 1 ? 'entry' : 'entries'}. Everything currently on this device will be replaced.`
          : ''}
        confirmLabel="Replace my data"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (!pendingImport) return
          importData(pendingImport)
          setPendingImport(null)
          setDataMessage({ tone: 'ok', text: 'Backup imported.' })
        }}
      />

      <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', paddingBottom: 8, marginTop: 16 }}>
        Broono local edition — no account, sync or remote backup.
      </p>
      <div style={{ textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', paddingBottom: 24 }}>
        <a href="/privacy" style={{ fontSize: 13, color: '#475569', textDecoration: 'underline', padding: '12px 4px' }}>Privacy Policy</a>
        <a href="/terms" style={{ fontSize: 13, color: '#475569', textDecoration: 'underline', padding: '12px 4px' }}>Terms of Use</a>
      </div>
    </div>
  )
}
