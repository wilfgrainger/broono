import { useEffect, useRef, useState } from 'react'
import { ArrowRight, AlertCircle, Check } from 'lucide-react'
import { useStore, type InjectionSite, type Symptom } from '../store'
import { formatShortDate, toLocalISODate } from '../utils/date'
import { getWeightInputUnitLabel } from '../utils/weight'

const SITES: InjectionSite[] = ['Left Stomach', 'Right Stomach', 'Left Thigh', 'Right Thigh']
const SYMPTOMS: Symptom[] = ['None', 'Nausea', 'Fatigue', 'Headache', 'Constipation']

interface CheckInProps {
    onDone: () => void
}

export default function CheckIn({ onDone }: CheckInProps) {
    const logs = useStore((s) => s.logs)
    const addLog = useStore((s) => s.addLog)
    const weightUnit = useStore((s) => s.profile.weightUnit)
    const lastSite = logs[0]?.site

    const [weight, setWeight] = useState('')
    const [site, setSite] = useState<InjectionSite | ''>('')
    const [symptom, setSymptom] = useState<Symptom>('None')
    const [notes, setNotes] = useState('')
    const [saved, setSaved] = useState(false)
    const [weightError, setWeightError] = useState('')
    const weightInputRef = useRef<HTMLInputElement>(null)

    // Return to the dashboard after the confirmation, unless the user has
    // already navigated elsewhere (the timer is cleared on unmount).
    useEffect(() => {
        if (!saved) return
        const timer = window.setTimeout(onDone, 1600)
        return () => window.clearTimeout(timer)
    }, [saved, onDone])

    const handleSave = (event: React.FormEvent) => {
        event.preventDefault()
        const parsedWeight = Number.parseFloat(weight)
        if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
            setWeightError(`Enter your weight in ${getWeightInputUnitLabel(weightUnit)} to save this log.`)
            weightInputRef.current?.focus()
            return
        }
        const date = toLocalISODate()
        addLog({
            date,
            displayDate: formatShortDate(date),
            weight: parsedWeight,
            site,
            symptoms: [symptom],
            notes: notes.trim(),
        })
        setSaved(true)
    }

    if (saved) {
        return (
            <div role="status" className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '72vh', gap: 20 }}>
                <div
                    className="scale-in"
                    style={{ width: 96, height: 96, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(20,184,166,0.15)' }}
                >
                    <Check size={48} color="#14b8a6" strokeWidth={2.5} aria-hidden="true" />
                </div>
                <h1 className="page-title">Log Saved</h1>
            </div>
        )
    }

    return (
        <form className="page-enter space-y-6" style={{ paddingTop: 8 }} onSubmit={handleSave} noValidate aria-labelledby="checkin-title">
            <div>
                <h1 id="checkin-title" className="page-title">Weekly Log</h1>
                <p className="page-subtitle">Update stats and rotate your injection site.</p>
            </div>

            {/* Weight input */}
            <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <label htmlFor="weight-input" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>
                    Current Weight
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8 }}>
                    <input
                        ref={weightInputRef}
                        id="weight-input"
                        className="weight-input"
                        name="weight"
                        type="number"
                        inputMode="decimal"
                        enterKeyHint="done"
                        required
                        min="1"
                        value={weight}
                        onChange={(e) => {
                            setWeight(e.target.value)
                            if (weightError) setWeightError('')
                        }}
                        placeholder="0.0"
                        step="0.1"
                        aria-invalid={weightError ? true : undefined}
                        aria-describedby={weightError ? 'weight-error' : undefined}
                        style={{
                            width: 190,
                            textAlign: 'center',
                            fontSize: 58,
                            fontWeight: 900,
                            letterSpacing: '-2px',
                            border: 'none',
                            borderRadius: 16,
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            transition: 'color 0.2s',
                        }}
                    />
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-muted)' }}>{getWeightInputUnitLabel(weightUnit)}</span>
                </div>
                {weightError ? <p id="weight-error" role="alert" className="field-error">{weightError}</p> : null}
            </div>

            {/* Injection site */}
            <div className="card">
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, background: 'var(--bg)',
                    borderRadius: 14, padding: 16, marginBottom: 20
                }}>
                    <AlertCircle size={18} color="var(--text-secondary)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                    <div>
                        <p id="site-group-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Site Rotation</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                            Last injection: <strong>{lastSite || 'Not recorded'}</strong>. Choose a different area.
                        </p>
                    </div>
                </div>
                <div className="selector-grid" role="group" aria-labelledby="site-group-label">
                    {SITES.map((s) => (
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

            {/* Side effects */}
            <div className="card">
                <p id="symptom-group-label" style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Side Effects?</p>
                <div role="group" aria-labelledby="symptom-group-label" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {SYMPTOMS.map((sym) => (
                        <button
                            type="button"
                            key={sym}
                            id={`symptom-${sym.toLowerCase()}`}
                            onClick={() => setSymptom(sym)}
                            aria-pressed={symptom === sym}
                            className="pill-btn"
                            style={{
                                padding: '12px 18px',
                                minHeight: 44,
                                fontSize: 13,
                                background: symptom === sym ? 'var(--primary)' : 'var(--bg)',
                                color: symptom === sym ? 'white' : 'var(--text-secondary)',
                                border: symptom === sym ? '1px solid var(--primary)' : '1px solid var(--border)',
                                boxShadow: symptom === sym ? '0 4px 14px rgba(99, 102, 241, 0.2)' : 'none',
                            }}
                        >
                            {sym}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div className="card" style={{ padding: '20px 24px' }}>
                <label htmlFor="notes-input" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Notes (optional)</label>
                <textarea
                    id="notes-input"
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How are you feeling this week?"
                    style={{
                        width: '100%',
                        minHeight: 80,
                        border: 'none',
                        borderRadius: 8,
                        background: 'transparent',
                        fontFamily: 'inherit',
                        fontSize: 16,
                        resize: 'vertical',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                    }}
                />
            </div>

            {/* Save */}
            <button
                type="submit"
                id="save-log-btn"
                className="btn-primary"
            >
                Save Log <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
        </form>
    )
}
