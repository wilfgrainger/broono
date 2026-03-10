import { Beef, Droplets, TrendingDown, Plus } from 'lucide-react'
import { useStore, getMedicationLevel, getDaysUntilNextDose } from '../store'

interface DashboardProps {
    onNavigate: (tab: 'dashboard' | 'checkin' | 'progress' | 'news' | 'journal' | 'profile') => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
    const profile = useStore((s) => s.profile)
    const logs = useStore((s) => s.logs)
    const dailyWater = useStore((s) => s.dailyWater)
    const addWaterGlass = useStore((s) => s.addWaterGlass)

    const today = new Date()
    const greeting = today.getHours() < 12 ? 'Good Morning.' : today.getHours() < 18 ? 'Good Afternoon.' : 'Good Evening.'
    const todayDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    const currentWeight = logs[0]?.weight ?? profile.startWeight
    const totalLost = (profile.startWeight - currentWeight).toFixed(1)
    const currentWeightStr = currentWeight.toFixed(1)

    const medLevel = getMedicationLevel(logs[0]?.date, profile.medicationName)
    const daysUntilDose = getDaysUntilNextDose(profile.injectionDayOfWeek)

    const waterGlasses = dailyWater.glasses
    const waterPct = Math.round((waterGlasses / profile.waterGoalGlasses) * 100)

    return (
        <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
            {/* Greeting */}
            <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>
                    {todayDate}
                </p>
                <h1 className="page-title">{greeting}</h1>
            </div>

            {/* Weight Card */}
            <div className="card">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Current Weight</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="weight-display">{currentWeightStr}</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>{profile.weightUnit}</span>
                </div>
                <div className="badge-teal">
                    <TrendingDown size={13} strokeWidth={3} />
                    {totalLost} {profile.weightUnit} total
                </div>
            </div>

            {/* Medication Level Card */}
            <div className="card-gradient">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(204,235,245,0.7)', marginBottom: 4, letterSpacing: '.5px' }}>
                                Active Medication
                            </p>
                            <p style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
                                {medLevel}%
                            </p>
                        </div>
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: 14,
                            padding: '10px 16px',
                            textAlign: 'right',
                        }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(204,235,245,0.7)', marginBottom: 2 }}>Next Dose</p>
                            <p style={{ fontSize: 14, fontWeight: 700 }}>{daysUntilDose} Days</p>
                        </div>
                    </div>
                    <div className="med-progress-track">
                        <div className="med-progress-fill" style={{ width: `${medLevel}%` }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(204,235,245,0.6)', marginTop: 14, letterSpacing: '.3px', fontWeight: 500 }}>
                        {profile.medicationName} {profile.dose} levels naturally decline before your next shot.
                    </p>
                </div>
            </div>

            {/* Daily Targets */}
            <div className="card">
                <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24 }}>Daily Targets</h3>

                {/* Protein */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
                            <span style={{ background: '#fff1f2', borderRadius: 8, padding: 6, display: 'flex' }}>
                                <Beef size={15} color="#f43f5e" strokeWidth={2} />
                            </span>
                            Protein
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>—  / {profile.proteinGoalG}g</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `0%`, background: '#fb7185' }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
                        Log meals to track protein
                    </p>
                </div>

                {/* Water */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
                            <span style={{ background: '#eff6ff', borderRadius: 8, padding: 6, display: 'flex' }}>
                                <Droplets size={15} color="#3b82f6" strokeWidth={2} />
                            </span>
                            Water
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                            {waterGlasses} / {profile.waterGoalGlasses} glasses
                        </span>
                    </div>
                    <div className="progress-track" style={{ marginBottom: 14 }}>
                        <div className="progress-fill" style={{ width: `${waterPct}%`, background: '#60a5fa' }} />
                    </div>
                    <button
                        id="add-water-glass-btn"
                        className="water-add-btn"
                        onClick={addWaterGlass}
                        disabled={waterGlasses >= profile.waterGoalGlasses}
                    >
                        {waterGlasses >= profile.waterGoalGlasses ? '✓ Goal Reached!' : '+ Add Glass'}
                    </button>
                </div>
            </div>

            {/* Quick action — Log this week */}
            <button
                onClick={() => onNavigate('checkin')}
                id="quick-log-btn"
                className="quick-log-btn"
            >
                <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Log this week</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>Weight + injection site</p>
                </div>
                <div className="icon-wrap">
                    <Plus size={18} color="white" strokeWidth={2.5} />
                </div>
            </button>
        </div>
    )
}
