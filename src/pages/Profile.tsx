import { useRef, useState } from 'react'
import { CalendarPlus } from 'lucide-react'
import ChoiceGroup from '../components/ChoiceGroup'
import ConfirmDialog, { type ConfirmDialogHandle } from '../components/ConfirmDialog'
import DoseInput from '../components/DoseInput'
import WeightField from '../components/WeightField'
import { LIMITS, MEDICATIONS, STORE_VERSION, sanitizePersistedState, useStore, type PersistedAppState } from '../store'
import { buildWeeklyReminderIcs } from '../utils/calendar'
import { toCsv } from '../utils/csv'
import { toLocalISODate } from '../utils/date'
import { formatDose } from '../utils/medications'
import { saveFile } from '../utils/saveFile'
import { getColorScheme, setColorScheme, type ColorScheme } from '../utils/theme'
import { WEIGHT_UNIT_OPTIONS, getWeightInputUnitLabel, validateWeight } from '../utils/weight'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MAX_IMPORT_BYTES = 5 * 1024 * 1024

interface NumberSettingProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  hint: string
  onCommit: (value: number) => void
}

// Keeps what the user is typing as a local draft, so the field can be cleared and
// retyped, and only ever writes an in-range whole number to the store.
function NumberSetting({ id, label, value, min, max, hint, onCommit }: NumberSettingProps) {
  const [draft, setDraft] = useState(value > 0 ? `${value}` : '')
  const hintId = `${id}-hint`

  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
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
        onBlur={() => setDraft(value > 0 ? `${value}` : '')}
      />
      <p id={hintId} style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{hint}</p>
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
  const [scheme, setScheme] = useState<ColorScheme>(getColorScheme)

  const report = (result: Awaited<ReturnType<typeof saveFile>>, what: string) => {
    if (result === 'cancelled') return setDataMessage(null)
    setDataMessage({ tone: 'ok', text: result === 'shared' ? `${what} created.` : `${what} created. Check your downloads.` })
  }

  const runSave = async (task: () => Promise<void>) => {
    try {
      await task()
    } catch {
      setDataMessage({ tone: 'error', text: 'The file could not be created. Please try again.' })
    }
  }

  const handleExport = () => runSave(async () => {
    // Read the latest state at click time rather than subscribing this page to every change.
    const { profile: currentProfile, logs, journalEntries, dailyWater, dailyProtein } = useStore.getState()
    const json = JSON.stringify({
      app: 'broono',
      formatVersion: STORE_VERSION,
      exportedAt: new Date().toISOString(),
      profile: currentProfile,
      logs,
      journalEntries,
      dailyWater,
      dailyProtein,
    }, null, 2)
    report(await saveFile(json, `broono-export-${toLocalISODate()}.json`), 'Backup file')
  })

  const handleCsvExport = () => runSave(async () => {
    const { profile: currentProfile, logs } = useStore.getState()
    const unitLabel = getWeightInputUnitLabel(currentProfile.weightUnit)
    const csv = toCsv(
      ['Date', `Weight (${unitLabel})`, 'Injection site', 'Dose (mg)', 'Side effects', 'Notes'],
      [...logs].reverse().map((log) => [
        log.date,
        log.weight > 0 ? log.weight : '',
        log.site,
        log.doseMg > 0 ? log.doseMg : '',
        log.symptoms.filter((symptom) => symptom !== 'None').join('; ') || 'None',
        log.notes,
      ]),
    )
    report(await saveFile(csv, `broono-logs-${toLocalISODate()}.csv`, 'text/csv', 'Broono logs'), 'Spreadsheet')
  })

  const handleReminder = () => runSave(async () => {
    const ics = buildWeeklyReminderIcs({
      dayOfWeek: profile.injectionDayOfWeek,
      time: profile.reminderTime,
      title: `${profile.medicationName} injection${profile.doseMg ? `, ${formatDose(profile.doseMg)}` : ''}`,
      description: 'Weekly injection reminder from Broono. Open Broono to log it and see the suggested site.',
      uid: `weekly-dose-${globalThis.crypto?.randomUUID?.() ?? Date.now()}@broono.app`,
    })
    report(await saveFile(ics, 'broono-weekly-reminder.ics', 'text/calendar', 'Weekly injection reminder'), 'Calendar reminder')
  })

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

      <div className="card space-y-5">
        <ChoiceGroup
          legend="Medication"
          name="medication"
          layout="stack"
          options={MEDICATIONS.map((value) => ({ value, label: value }))}
          value={profile.medicationName}
          onChange={(medicationName) => updateProfile({ medicationName })}
        />
        <DoseInput
          key={profile.medicationName}
          id="dose-input"
          label="Current dose"
          medication={profile.medicationName}
          value={profile.doseMg}
          onChange={(doseMg) => updateProfile({ doseMg })}
        />
      </div>

      <div className="card space-y-5">
        <ChoiceGroup
          legend="Injection day"
          name="injection-day"
          layout="week"
          options={DAY_NAMES.map((day, index) => ({ value: `${index}`, label: day.slice(0, 2), ariaLabel: day }))}
          value={`${profile.injectionDayOfWeek}`}
          onChange={(value) => updateProfile({ injectionDayOfWeek: Number(value) })}
        />
        <div>
          <label htmlFor="reminder-time" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Reminder time</label>
          <input
            id="reminder-time"
            name="reminderTime"
            type="time"
            className="form-input"
            value={profile.reminderTime}
            onChange={(event) => { if (/^\d{2}:\d{2}$/.test(event.target.value)) updateProfile({ reminderTime: event.target.value }) }}
          />
        </div>
        <button type="button" className="btn-secondary" onClick={() => void handleReminder()}>
          <CalendarPlus size={18} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: 8 }} />
          Add a weekly reminder to my calendar
        </button>
        <p className="muted-text" style={{ marginTop: 8 }}>
          Every {DAY_NAMES[profile.injectionDayOfWeek]} at {profile.reminderTime}. Your calendar app does the reminding, so it works even when Broono is closed. Add it again if you change the day.
        </p>
        <div>
          <label htmlFor="treatment-start" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Treatment start date</label>
          <input
            id="treatment-start"
            name="treatmentStartDate"
            type="date"
            className="form-input"
            max={toLocalISODate()}
            value={profile.treatmentStartDate}
            onChange={(event) => updateProfile({ treatmentStartDate: /^\d{4}-\d{2}-\d{2}$/.test(event.target.value) ? event.target.value : '' })}
          />
        </div>
      </div>

      <div className="card space-y-5 settings-card">
        <h2 className="choice-legend" style={{ marginBottom: 0 }}>Goals and body</h2>
        <WeightField
          key={profile.weightUnit}
          label="Goal weight (optional)"
          unit={profile.weightUnit}
          value={profile.goalWeight > 0 ? profile.goalWeight : null}
          onChange={(value) => updateProfile({ goalWeight: value === null ? 0 : validateWeight(value, profile.weightUnit) ?? 0 })}
        />
        <NumberSetting
          id="height-cm"
          label="Height in cm (optional, for BMI)"
          value={profile.heightCm}
          min={100}
          max={250}
          hint="Only used to show your BMI on Progress."
          onCommit={(heightCm) => updateProfile({ heightCm })}
        />
        <NumberSetting
          id="protein-goal"
          label="Protein goal (g per day)"
          value={profile.proteinGoalG}
          min={LIMITS.proteinGoal.min}
          max={LIMITS.proteinGoal.max}
          hint={`Between ${LIMITS.proteinGoal.min} and ${LIMITS.proteinGoal.max}.`}
          onCommit={(proteinGoalG) => updateProfile({ proteinGoalG })}
        />
        <NumberSetting
          id="water-goal"
          label="Water goal (glasses per day)"
          value={profile.waterGoalGlasses}
          min={LIMITS.waterGoal.min}
          max={LIMITS.waterGoal.max}
          hint={`Between ${LIMITS.waterGoal.min} and ${LIMITS.waterGoal.max}.`}
          onCommit={(waterGoalGlasses) => updateProfile({ waterGoalGlasses })}
        />
      </div>

      <div className="card space-y-5">
        <ChoiceGroup
          legend="Weight unit"
          description="Your saved weights are converted when you change unit."
          name="weight-unit"
          layout="stack"
          options={WEIGHT_UNIT_OPTIONS.map(({ unit, label }) => ({ value: unit, label }))}
          value={profile.weightUnit}
          onChange={setWeightUnit}
        />
        <ChoiceGroup
          legend="Appearance"
          name="appearance"
          layout="grid"
          options={[
            { value: 'light dark', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          value={scheme}
          onChange={(next: ColorScheme) => {
            setColorScheme(next)
            setScheme(next)
          }}
        />
      </div>

      <div className="card" style={{ background: 'var(--surface-sunken)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Your data</h2>
        <p className="muted-text" style={{ marginBottom: 16 }}>
          Broono has no account or cloud database. Your profile, logs and journal stay in this browser or app installation. Export a backup before clearing browser or app data or changing devices, and import it to restore.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <button type="button" id="export-btn" onClick={() => void handleExport()} className="btn-primary">
            Export my local data
          </button>
          <button type="button" id="import-btn" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
            Import a backup
          </button>
          <button type="button" id="csv-btn" onClick={() => void handleCsvExport()} className="btn-secondary">
            Export logs as a spreadsheet (CSV)
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
          style={{ fontSize: 13, fontWeight: 600, marginTop: dataMessage ? 12 : 0, color: dataMessage?.tone === 'error' ? 'var(--danger)' : 'var(--success)' }}
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
          ? `The backup has ${pendingImport.logs.length} ${pendingImport.logs.length === 1 ? 'log' : 'logs'} and ${pendingImport.journalEntries.length} journal ${pendingImport.journalEntries.length === 1 ? 'entry' : 'entries'}. Everything currently on this device will be replaced.`
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

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', paddingBottom: 8, marginTop: 16 }}>
        Broono local edition — no account, sync or remote backup.
      </p>
      <div style={{ textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', paddingBottom: 24 }}>
        <a href="/privacy" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'underline', padding: '12px 4px' }}>Privacy Policy</a>
        <a href="/terms" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'underline', padding: '12px 4px' }}>Terms of Use</a>
      </div>
    </div>
  )
}
