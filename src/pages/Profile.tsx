import { useStore, type MedicationName } from '../store'
import DaySelection from '../components/DaySelection'

const MEDICATIONS: MedicationName[] = ['Zepbound', 'Mounjaro', 'Wegovy', 'Ozempic']
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function ProfilePage() {
    const profile = useStore((s) => s.profile)
    const logs = useStore((s) => s.logs)
    const journalEntries = useStore((s) => s.journalEntries)
    const updateProfile = useStore((s) => s.updateProfile)
    const logout = useStore((s) => s.logout)
    const authToken = useStore((s) => s.authToken)

    const handleExport = () => {
        // Exporting data logic
        const dataStr = JSON.stringify({
            profile,
            logs,
            journalEntries
        }, null, 2)

        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'broono_data_export.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This will permanently delete your data.')) {
            return
        }

        try {
            const res = await fetch(`${API_URL}/api/user`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })

            if (res.ok) {
                localStorage.clear()
                logout()
            } else {
                alert('Failed to delete account.')
            }
        } catch (e) {
            console.error('Failed to delete account', e)
            alert('Failed to delete account.')
        }
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
            <DaySelection
                currentDay={profile.injectionDayOfWeek}
                onUpdate={(idx) => updateProfile({ injectionDayOfWeek: idx })}
            />

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

            {/* Delete Account */}
            <button
                id="delete-account-btn"
                onClick={handleDeleteAccount}
                style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#e11d48',
                    border: 'none',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    padding: '12px 24px',
                    cursor: 'pointer',
                    transition: 'opacity .15s',
                    marginTop: 8
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.opacity = '0.8' }}
                onMouseLeave={(e) => { (e.currentTarget).style.opacity = '1' }}
            >
                Delete Account
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', paddingBottom: 8, marginTop: 16 }}>
                Broono v0.1.0 · Your data stays private and on-device.
            </p>
        </div>
    )
}
