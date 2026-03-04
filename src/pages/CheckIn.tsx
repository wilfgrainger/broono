import { useState } from 'react'
import { ArrowRight, AlertCircle, Check } from 'lucide-react'
import { useStore, type InjectionSite, type Symptom } from '../store'

const SITES: InjectionSite[] = ['Left Stomach', 'Right Stomach', 'Left Thigh', 'Right Thigh']
const SYMPTOMS: Symptom[] = ['None', 'Nausea', 'Fatigue', 'Headache', 'Constipation']

interface CheckInProps {
    onDone: () => void
}

export default function CheckIn({ onDone }: CheckInProps) {
    const logs = useStore((s) => s.logs)
    const addLog = useStore((s) => s.addLog)
    const lastSite = logs[0]?.site

    const [weight, setWeight] = useState('')
    const [site, setSite] = useState<InjectionSite | ''>('')
    const [symptom, setSymptom] = useState<Symptom>('None')
    const [notes, setNotes] = useState('')
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        if (!weight.trim()) return
        const today = new Date()
        addLog({
            date: today.toISOString().split('T')[0],
            displayDate: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weight: parseFloat(weight),
            site,
            symptoms: [symptom],
            notes,
        })
        setSaved(true)
        setTimeout(() => {
            setSaved(false)
            onDone()
        }, 1600)
    }

    if (saved) {
        return (
            <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '72vh', gap: 20 }}>
                <div
                    className="scale-in"
                    style={{ width: 96, height: 96, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(20,184,166,0.15)' }}
                >
                    <Check size={48} color="#14b8a6" strokeWidth={2.5} />
                </div>
                <h2 className="page-title">Log Saved</h2>
            </div>
        )
    }

    return (
        <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
            <div>
                <h2 className="page-title">Weekly Log</h2>
                <p className="page-subtitle">Update stats and rotate your injection site.</p>
            </div>

            {/* Weight input */}
            <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <label htmlFor="weight-input" style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 16 }}>
                    Current Weight
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8 }}>
                    <input
                        id="weight-input"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="0.0"
                        step="0.1"
                        style={{
                            width: 160,
                            textAlign: 'center',
                            fontSize: 58,
                            fontWeight: 900,
                            letterSpacing: '-2px',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: weight ? '#0f172a' : '#e2e8f0',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    />
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8' }}>lbs</span>
                </div>
            </div>

            {/* Injection site */}
            <div className="card">
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, background: '#f8fafc',
                    borderRadius: 14, padding: 16, marginBottom: 20
                }}>
                    <AlertCircle size={18} color="#64748b" strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Site Rotation</p>
                        <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                            Last injection: <strong>{lastSite || 'Not recorded'}</strong>. Choose a different area.
                        </p>
                    </div>
                </div>
                <div className="selector-grid">
                    {SITES.map((s) => (
                        <button
                            key={s}
                            id={`site-${s.replace(/ /g, '-').toLowerCase()}`}
                            onClick={() => setSite(s)}
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
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Side Effects?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {SYMPTOMS.map((sym) => (
                        <button
                            key={sym}
                            id={`symptom-${sym.toLowerCase()}`}
                            onClick={() => setSymptom(sym)}
                            aria-pressed={symptom === sym}
                            className="pill-btn"
                            style={{
                                padding: '10px 18px',
                                fontSize: 13,
                                background: symptom === sym ? 'var(--brand)' : '#f8fafc',
                                color: symptom === sym ? 'white' : '#64748b',
                                border: symptom === sym ? '1px solid var(--brand)' : '1px solid #f1f5f9',
                                boxShadow: symptom === sym ? '0 4px 14px rgba(0,91,127,0.2)' : 'none',
                            }}
                        >
                            {sym}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notes */}
            <div className="card" style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Notes (optional)</p>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="How are you feeling this week?"
                    style={{
                        width: '100%',
                        minHeight: 80,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 14,
                        resize: 'none',
                        color: '#334155',
                        lineHeight: 1.6,
                    }}
                />
            </div>

            {/* Save */}
            <button
                id="save-log-btn"
                className="btn-primary"
                onClick={handleSave}
                disabled={!weight}
                title={!weight ? "Enter current weight to save" : undefined}
                style={{ opacity: weight ? 1 : 0.5 }}
            >
                Save Log <ArrowRight size={18} strokeWidth={2.5} />
            </button>
        </div>
    )
}
