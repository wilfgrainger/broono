import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import ChoiceGroup from '../components/ChoiceGroup'
import DoseInput from '../components/DoseInput'
import WeightField from '../components/WeightField'
import { INJECTION_SITES, LIMITS, SYMPTOMS, useStore, type InjectionSite, type Symptom } from '../store'
import { formatShortDate, toLocalISODate } from '../utils/date'
import { getDoseStatus } from '../utils/medication'
import { suggestNextSite } from '../utils/stats'
import { getWeightUnitName, validateWeight } from '../utils/weight'

interface CheckInProps {
    onDone: () => void
}

type SiteChoice = InjectionSite | 'none'

export default function CheckIn({ onDone }: CheckInProps) {
    const logs = useStore((s) => s.logs)
    const profile = useStore((s) => s.profile)
    const addLog = useStore((s) => s.addLog)
    const updateProfile = useStore((s) => s.updateProfile)
    const weightUnit = profile.weightUnit
    const today = toLocalISODate()
    const injectionLogs = logs.filter((log) => log.site)
    const suggestion = suggestNextSite(injectionLogs)
    const doseDue = getDoseStatus(profile.injectionDayOfWeek, injectionLogs[0]?.date, today).daysUntil === 0

    const [weight, setWeight] = useState<number | null>(null)
    const [date, setDate] = useState(today)
    // On dose day the injection is the likely reason for logging, so start with the suggested site.
    const [site, setSite] = useState<SiteChoice | ''>(doseDue ? suggestion.site : '')
    const [doseMg, setDoseMg] = useState(profile.doseMg)
    const [symptoms, setSymptoms] = useState<Symptom[]>(['None'])
    const [notes, setNotes] = useState('')
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<{ field: 'weight' | 'entry'; message: string } | null>(null)
    const weightInputRef = useRef<HTMLInputElement>(null)
    const savedHeadingRef = useRef<HTMLHeadingElement>(null)
    const injected = site !== '' && site !== 'none'

    // Return to the dashboard after the confirmation, unless the user has
    // already navigated elsewhere (the timer is cleared on unmount).
    useEffect(() => {
        if (!saved) return
        // The form, and the focused Save button with it, has just been removed.
        savedHeadingRef.current?.focus()
        const timer = window.setTimeout(onDone, 1600)
        return () => window.clearTimeout(timer)
    }, [saved, onDone])

    // "None" and real side effects are mutually exclusive; several real ones can be chosen.
    const changeSymptoms = (next: Symptom[]) => {
        const addedNone = next.includes('None') && !symptoms.includes('None')
        if (addedNone) return setSymptoms(['None'])
        const real = next.filter((symptom) => symptom !== 'None')
        setSymptoms(real.length > 0 ? real : ['None'])
    }

    const handleSave = (event: React.FormEvent) => {
        event.preventDefault()
        const validWeight = weight === null ? null : validateWeight(weight, weightUnit)
        if (weight !== null && validWeight === null) {
            setError({ field: 'weight', message: 'That weight does not look right. Check the number and the unit in Settings.' })
            weightInputRef.current?.focus()
            return
        }
        if (validWeight === null && !injected) {
            setError({ field: 'entry', message: `Add your weight in ${getWeightUnitName(weightUnit).toLowerCase()}, an injection, or both.` })
            weightInputRef.current?.focus()
            return
        }
        // A cleared or future date falls back to today.
        const logDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today ? date : today
        const dose = injected && doseMg > 0 ? doseMg : 0
        addLog({
            date: logDate,
            displayDate: formatShortDate(logDate),
            weight: validWeight ?? 0,
            site: injected ? site : '',
            doseMg: dose,
            symptoms,
            notes: notes.trim(),
        })
        // A new dose on the most recent injection is a dose change (titration).
        const isLatestInjection = !injectionLogs.some((log) => log.date > logDate)
        if (dose > 0 && isLatestInjection && dose !== profile.doseMg) updateProfile({ doseMg: dose })
        setSaved(true)
    }

    if (saved) {
        return (
            <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '72vh', gap: 20 }}>
                <div
                    className="scale-in"
                    style={{ width: 96, height: 96, background: 'var(--success-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Check size={48} color="var(--teal)" strokeWidth={2.5} aria-hidden="true" />
                </div>
                <h1 ref={savedHeadingRef} tabIndex={-1} role="status" className="page-title">Log Saved</h1>
            </div>
        )
    }

    const siteOptions = [
        ...INJECTION_SITES.map((value) => ({ value, label: value, hint: value === suggestion.site ? 'Suggested' : undefined })),
        { value: 'none' as const, label: 'No injection this time' },
    ]

    return (
        <form className="page-enter space-y-6" style={{ paddingTop: 8 }} onSubmit={handleSave} noValidate aria-labelledby="checkin-title">
            <div>
                <h1 id="checkin-title" className="page-title">Add a log</h1>
                <p className="page-subtitle">Record an injection, a weigh-in, or both.</p>
            </div>

            {error?.field === 'entry' ? <p role="alert" className="field-error" style={{ marginTop: 0 }}>{error.message}</p> : null}

            <div className="card">
                <label htmlFor="log-date-input" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Date</label>
                <input
                    id="log-date-input"
                    name="date"
                    type="date"
                    className="form-input"
                    value={date}
                    max={today}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>

            <div className="card space-y-5">
                <ChoiceGroup
                    legend="Injection site"
                    description={suggestion.lastUsed
                        ? `Rotate sites: ${suggestion.site} was last used ${formatShortDate(suggestion.lastUsed)}, longer ago than any other.`
                        : `Rotate sites: ${suggestion.site} has not been used yet.`}
                    name="site"
                    options={siteOptions}
                    value={site}
                    onChange={(value) => {
                        setSite(value)
                        if (error?.field === 'entry') setError(null)
                    }}
                />
                {injected ? (
                    <DoseInput
                        id="log-dose-input"
                        label="Dose injected"
                        medication={profile.medicationName}
                        value={doseMg}
                        onChange={setDoseMg}
                    />
                ) : null}
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                <WeightField
                    key={weightUnit}
                    label="Weight (optional with an injection)"
                    unit={weightUnit}
                    value={weight}
                    onChange={(next) => {
                        setWeight(next)
                        if (error) setError(null)
                    }}
                    error={error?.field === 'weight' ? error.message : undefined}
                    size="display"
                    inputRef={weightInputRef}
                />
            </div>

            <div className="card">
                <ChoiceGroup<Symptom>
                    multiple
                    legend="Side effects"
                    description="Choose all that apply since your last log."
                    name="symptoms"
                    layout="wrap"
                    options={SYMPTOMS.map((value) => ({ value, label: value === 'None' ? 'None' : value }))}
                    value={symptoms}
                    onChange={changeSymptoms}
                />
            </div>

            <div className="card" style={{ padding: '20px 24px' }}>
                <label htmlFor="notes-input" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Notes (optional)</label>
                <textarea
                    id="notes-input"
                    name="notes"
                    className="form-input"
                    value={notes}
                    maxLength={LIMITS.notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Appetite, food noise, energy, anything worth remembering"
                    style={{ fontWeight: 500, lineHeight: 1.6 }}
                />
            </div>

            <button type="submit" id="save-log-btn" className="btn-primary">
                Save Log <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
        </form>
    )
}
