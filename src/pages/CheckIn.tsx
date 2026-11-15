import { useEffect, useRef, useState } from 'react'
import { ArrowRight, AlertCircle, Check } from 'lucide-react'
import { INJECTION_SITES, LIMITS, SYMPTOMS, useStore, type InjectionSite, type Symptom } from '../store'
import WeightField from '../components/WeightField'
import { formatShortDate, toLocalISODate } from '../utils/date'
import { getWeightUnitName, validateWeight } from '../utils/weight'

interface CheckInProps {
    onDone: () => void
}

export default function CheckIn({ onDone }: CheckInProps) {
    const logs = useStore((s) => s.logs)
    const addLog = useStore((s) => s.addLog)
    const weightUnit = useStore((s) => s.profile.weightUnit)
    const lastSite = logs[0]?.site
    const today = toLocalISODate()

    const [weight, setWeight] = useState<number | null>(null)
    const [date, setDate] = useState(today)
    const [site, setSite] = useState<InjectionSite | ''>('')
    const [symptoms, setSymptoms] = useState<Symptom[]>(['None'])
    const [notes, setNotes] = useState('')
    const [saved, setSaved] = useState(false)
    const [weightError, setWeightError] = useState('')
    const weightInputRef = useRef<HTMLInputElement>(null)
    const savedHeadingRef = useRef<HTMLHeadingElement>(null)

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
    const toggleSymptom = (symptom: Symptom) => {
        setSymptoms((current) => {
            if (symptom === 'None') return ['None']
            const withoutNone = current.filter((item) => item !== 'None')
            const next = withoutNone.includes(symptom)
                ? withoutNone.filter((item) => item !== symptom)
                : [...withoutNone, symptom]
            return next.length > 0 ? next : ['None']
        })
    }

    const handleSave = (event: React.FormEvent) => {
        event.preventDefault()
        const validWeight = weight === null ? null : validateWeight(weight, weightUnit)
        if (validWeight === null) {
            setWeightError(weight === null
                ? `Enter your weight in ${getWeightUnitName(weightUnit).toLowerCase()} to save this log.`
                : 'That weight does not look right. Check the number and the unit in Settings.')
            weightInputRef.current?.focus()
            return
        }
        // A cleared or future date falls back to today.
        const logDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today ? date : today
        addLog({
            date: logDate,
            displayDate: formatShortDate(logDate),
            weight: validWeight,
            site,
            symptoms,
            notes: notes.trim(),
        })
        setSaved(true)
    }

    if (saved) {
        return (
            <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '72vh', gap: 20 }}>
                <div
                    className="scale-in"
                    style={{ width: 96, height: 96, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(20,184,166,0.15)' }}
                >
                    <Check size={48} color="#0f766e" strokeWidth={2.5} aria-hidden="true" />
                </div>
                <h1 ref={savedHeadingRef} tabIndex={-1} role="status" className="page-title">Log Saved</h1>
            </div>
        )
    }

    return (
        <form className="page-enter space-y-6" style={{ paddingTop: 8 }} onSubmit={handleSave} noValidate aria-labelledby="checkin-title">
            <div>
                <h1 id="checkin-title" className="page-title">Weekly Log</h1>
                <p className="page-subtitle">Log on the day you inject: weight, site and how you feel.</p>
            </div>

            <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                <WeightField
                    key={weightUnit}
                    label="Current Weight"
                    unit={weightUnit}
                    value={weight}
                    onChange={(next) => {
                        setWeight(next)
                        if (weightError) setWeightError('')
                    }}
                    error={weightError}
                    size="display"
                    inputRef={weightInputRef}
                />
            </div>

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

            <div className="card">
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--bg)',
                    borderRadius: 14, padding: 16, marginBottom: 20
                }}>
                    <AlertCircle size={18} color="var(--text-secondary)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    <div>
                        <p id="site-group-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Injection Site</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                            {lastSite
                                ? <>Last time: <strong>{lastSite}</strong>. Choose a different area to rotate.</>
                                : 'Optional. Recording the site helps you rotate next time.'}
                        </p>
                    </div>
                </div>
                <div className="selector-grid" role="group" aria-labelledby="site-group-label">
                    {INJECTION_SITES.map((s) => (
                        <button
                            type="button"
                            key={s}
                            id={`site-${s.replace(/ /g, '-').toLowerCase()}`}
                            onClick={() => setSite(site === s ? '' : s)}
                            aria-pressed={site === s}
                            className={`selector-btn ${site === s ? 'selected' : ''}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                <p id="symptom-group-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Side Effects?</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Choose all that apply.</p>
                <div role="group" aria-labelledby="symptom-group-label" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {SYMPTOMS.map((sym) => {
                        const selected = symptoms.includes(sym)
                        return (
                            <button
                                type="button"
                                key={sym}
                                id={`symptom-${sym.toLowerCase()}`}
                                onClick={() => toggleSymptom(sym)}
                                aria-pressed={selected}
                                className="pill-btn"
                                style={{
                                    padding: '12px 18px',
                                    minHeight: 44,
                                    fontSize: 13,
                                    background: selected ? 'var(--brand-mid)' : 'var(--bg)',
                                    color: selected ? 'white' : 'var(--text-secondary)',
                                    border: selected ? '1px solid var(--brand-mid)' : '1px solid var(--border-strong)',
                                    boxShadow: selected ? '0 4px 14px rgba(99, 102, 241, 0.2)' : 'none',
                                }}
                            >
                                {sym}
                            </button>
                        )
                    })}
                </div>
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
                    placeholder="How are you feeling this week?"
                    style={{ minHeight: 96, resize: 'vertical', fontWeight: 500, lineHeight: 1.6 }}
                />
            </div>

            <button type="submit" id="save-log-btn" className="btn-primary">
                Save Log <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
        </form>
    )
}
