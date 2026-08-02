import { Beef, Droplets, Plus, TrendingDown } from 'lucide-react'
import { getDaysUntilNextDose, getMedicationLevel, useStore } from '../store'
import { formatWeight, getWeightUnitLabel } from '../utils/weight'

interface DashboardProps {
  onNavigate: (tab: 'dashboard' | 'checkin' | 'progress' | 'news' | 'journal' | 'profile') => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const profile = useStore((state) => state.profile)
  const logs = useStore((state) => state.logs)
  const dailyWater = useStore((state) => state.dailyWater)
  const addWaterGlass = useStore((state) => state.addWaterGlass)

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning.' : today.getHours() < 18 ? 'Good afternoon.' : 'Good evening.'
  const todayDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const hasStartWeight = profile.startWeight > 0
  const hasLogs = logs.length > 0
  const currentWeight = logs[0]?.weight ?? (hasStartWeight ? profile.startWeight : null)
  const totalLost = hasLogs && hasStartWeight && currentWeight !== null ? profile.startWeight - currentWeight : null
  const currentWeightStr = currentWeight !== null ? formatWeight(currentWeight, profile.weightUnit) : '--'

  const medLevel = getMedicationLevel(logs[0]?.date, profile.medicationName)
  const daysUntilDose = getDaysUntilNextDose(profile.injectionDayOfWeek)
  const waterGlasses = dailyWater.glasses
  const waterPct = Math.round((waterGlasses / profile.waterGoalGlasses) * 100)

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 6 }}>
          {todayDate}
        </p>
        <h1 className="page-title">{greeting}</h1>
        <p className="page-subtitle">Everything here is stored on this device.</p>
      </div>

      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Current Weight</p>
        <div>
          <span className="weight-display">{currentWeightStr}</span>
        </div>
        <div className="badge-teal">
          <TrendingDown size={13} strokeWidth={3} />
          {totalLost !== null ? `${formatWeight(totalLost, profile.weightUnit)} total` : `Add your first log to start tracking in ${getWeightUnitLabel(profile.weightUnit)}`}
        </div>
      </div>

      <div className="card-gradient">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(204,235,245,0.7)', marginBottom: 4, letterSpacing: '.5px' }}>
                Estimated Medication Level
              </p>
              <p style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
                {medLevel}%
              </p>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)', borderRadius: 14, padding: '10px 16px', textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(204,235,245,0.7)', marginBottom: 2 }}>Next Dose</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{daysUntilDose} days</p>
            </div>
          </div>
          <div className="med-progress-track">
            <div className="med-progress-fill" style={{ width: `${medLevel}%` }} />
          </div>
          <p style={{ fontSize: 11, color: 'rgba(204,235,245,0.6)', marginTop: 14, letterSpacing: '.3px', fontWeight: 500 }}>
            This is a simple estimate for personal tracking, not a clinical measurement or dosing recommendation.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 24 }}>Daily Targets</h3>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
              <span style={{ background: '#fff1f2', borderRadius: 8, padding: 6, display: 'flex' }}>
                <Beef size={15} color="#f43f5e" strokeWidth={2} />
              </span>
              Protein
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Pending / {profile.proteinGoalG}g</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '0%', background: '#fb7185' }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
            Meal tracking is not yet included. Use your private notes for context.
          </p>
        </div>

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
            {waterGlasses >= profile.waterGoalGlasses ? 'Goal reached' : '+ Add glass'}
          </button>
        </div>
      </div>

      <button onClick={() => onNavigate('checkin')} id="quick-log-btn" className="quick-log-btn">
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
