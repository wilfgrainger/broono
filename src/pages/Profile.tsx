import { useStore, type MedicationName } from '../store'
import { useState } from 'react'
import PaywallModal from '../components/PaywallModal'

const MEDICATIONS: MedicationName[] = ['Zepbound', 'Mounjaro', 'Wegovy', 'Ozempic']

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ProfilePage() {
    const profile = useStore((s) => s.profile)
    const updateProfile = useStore((s) => s.updateProfile)
    const logout = useStore((s) => s.logout)
    const subscriptionStatus = useStore((s) => s.subscriptionStatus)

    const [showPaywall, setShowPaywall] = useState(false)

    const handleExport = () => {
        if (subscriptionStatus !== 'pro') {
            setShowPaywall(true)
            return
        }
        // Stubbed for now — will generate PDF via Cloudflare Worker in v1.1
        alert('Doctor export generating...')
    }

    return (
        <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
            <div>
                <h2 className="page-title">Settings</h2>
                <p className="page-subtitle">Manage your protocol.</p>
            </div>

            {/* Medication */}
            <div className="card">
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Medication</p>
                <div className="selector-grid">
                    {MEDICATIONS.map((m) => (
                        <button
                            key={m}
                            id={`med-${m.toLowerCase()}`}
                            onClick={() => updateProfile({ medicationName: m })}
                            className={`selector-btn ${profile.medicationName === m ? 'selected' : ''}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dose */}
            <div className="card">
                <label htmlFor="dose-input" style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                    Current Dose
                </label>
                <input
                    id="dose-input"
                    type="text"
                    value={profile.dose}
                    onChange={(e) => updateProfile({ dose: e.target.value })}
                    placeholder="e.g. 5mg"
                    className="form-input"
                />
            </div>

            {/* Injection day */}
            <div className="card">
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Injection Day</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                    {DAY_NAMES.map((day, idx) => (
                        <button
                            key={day}
                            id={`day-${day.toLowerCase()}`}
                            onClick={() => updateProfile({ injectionDayOfWeek: idx })}
                            style={{
                                padding: '10px 0',
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: '1px solid',
                                transition: 'all .15s',
                                background: profile.injectionDayOfWeek === idx ? '#0f172a' : '#f8fafc',
                                color: profile.injectionDayOfWeek === idx ? 'white' : '#64748b',
                                borderColor: profile.injectionDayOfWeek === idx ? '#0f172a' : '#e2e8f0',
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

            {/* Goals */}
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
                            onChange={(e) => updateProfile({ proteinGoalG: parseInt(e.target.value) || 100 })}
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
                            onChange={(e) => updateProfile({ waterGoalGlasses: parseInt(e.target.value) || 8 })}
                            min="4"
                            max="20"
                            className="form-input"
                        />
                    </div>
                </div>
            </div>

            {/* Weight unit */}
            <div className="card">
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Weight Unit</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(['lbs', 'kg'] as const).map((unit) => (
                        <button
                            key={unit}
                            id={`unit-${unit}`}
                            onClick={() => updateProfile({ weightUnit: unit })}
                            className={`selector-btn ${profile.weightUnit === unit ? 'selected' : ''}`}
                        >
                            {unit}
                        </button>
                    ))}
                </div>
            </div>

            {/* Export */}
            <button
                id="export-btn"
                onClick={handleExport}
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
                    transition: 'background .15s',
                    marginBottom: 16
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.background = '#fff1f2' }}
                onMouseLeave={(e) => { (e.currentTarget).style.background = 'white' }}
            >
                Export Data for Doctor
            </button>

            {/* Logout */}
            <button
                id="logout-btn"
                onClick={logout}
                style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '12px 24px',
                    cursor: 'pointer',
                    transition: 'color .15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.color = '#0f172a' }}
                onMouseLeave={(e) => { (e.currentTarget).style.color = '#64748b' }}
            >
                Sign Out
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', paddingBottom: 8, marginTop: 16 }}>
                Broono v0.1.0 · Your data stays private and on-device.
            </p>

            <PaywallModal
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                featureName="Doctor Data Export"
            />
        </div>
    )
}
