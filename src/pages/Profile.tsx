import { useState } from 'react'
import { useStore, type MedicationName } from '../store'
import { isNativePlatform, MONTHLY_PRICE, TRIAL_DAYS } from '../services/billing'
import PaywallModal from '../components/PaywallModal'

const MEDICATIONS: MedicationName[] = ['Zepbound', 'Mounjaro', 'Wegovy', 'Ozempic']
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ProfilePageProps {
  onRequestUpgrade: () => void
}

export default function ProfilePage({ onRequestUpgrade }: ProfilePageProps) {
  const profile = useStore((s) => s.profile)
  const logs = useStore((s) => s.logs)
  const journalEntries = useStore((s) => s.journalEntries)
  const updateProfile = useStore((s) => s.updateProfile)
  const logout = useStore((s) => s.logout)
  const resetApp = useStore((s) => s.resetApp)
  const authToken = useStore((s) => s.authToken)
  const subscriptionStatus = useStore((s) => s.subscriptionStatus)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const handleExport = () => {
    if (subscriptionStatus !== 'pro') {
      setShowUpgradeModal(true)
      return
    }

    const dataStr = JSON.stringify({ profile, logs, journalEntries }, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'broono_data_export.json'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = async () => {
    if (!authToken) {
      alert('Sign in again before deleting your account.')
      return
    }

    if (!confirm('Are you sure you want to delete your account? This will permanently delete your server account and local device data.')) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/user`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (res.ok) {
        resetApp()
        window.location.assign('/')
        return
      }

      alert('Failed to delete account.')
    } catch (error) {
      console.error('Failed to delete account', error)
      alert('Failed to delete account.')
    }
  }

  return (
    <div className="page-enter space-y-6" style={{ paddingTop: 8 }}>
      <div>
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Manage your protocol.</p>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Medication</p>
        <div className="selector-grid">
          {MEDICATIONS.map((medication) => (
            <button
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
          type="text"
          value={profile.dose}
          onChange={(e) => updateProfile({ dose: e.target.value })}
          placeholder="e.g. 5mg"
          className="form-input"
        />
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Injection Day</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {DAY_NAMES.map((day, index) => (
            <button
              key={day}
              id={`day-${day.toLowerCase()}`}
              onClick={() => updateProfile({ injectionDayOfWeek: index })}
              aria-pressed={profile.injectionDayOfWeek === index}
              style={{
                padding: '10px 0',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid',
                transition: 'all .15s',
                background: profile.injectionDayOfWeek === index ? '#0f172a' : '#f8fafc',
                color: profile.injectionDayOfWeek === index ? 'white' : '#64748b',
                borderColor: profile.injectionDayOfWeek === index ? '#0f172a' : '#e2e8f0',
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
              onChange={(e) => updateProfile({ proteinGoalG: parseInt(e.target.value, 10) || 100 })}
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
              onChange={(e) => updateProfile({ waterGoalGlasses: parseInt(e.target.value, 10) || 8 })}
              min="4"
              max="20"
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Weight Unit</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(['lbs', 'kg'] as const).map((unit) => (
            <button
              key={unit}
              id={`unit-${unit}`}
              onClick={() => updateProfile({ weightUnit: unit })}
              aria-pressed={profile.weightUnit === unit}
              className={`selector-btn ${profile.weightUnit === unit ? 'selected' : ''}`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Subscription</p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: subscriptionStatus === 'pro' ? '#f0fdf4' : '#fff7ed',
            borderRadius: 10,
            border: `1px solid ${subscriptionStatus === 'pro' ? '#bbf7d0' : '#fed7aa'}`,
          }}
        >
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: subscriptionStatus === 'pro' ? '#166534' : '#9a3412' }}>
              {subscriptionStatus === 'pro' ? 'Broono Pro' : 'Free Plan'}
            </p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {subscriptionStatus === 'pro'
                ? `${MONTHLY_PRICE}/month - Active`
                : `${TRIAL_DAYS}-day trial - ${MONTHLY_PRICE}/month`}
            </p>
          </div>
          {subscriptionStatus !== 'pro' ? (
            <button
              onClick={onRequestUpgrade}
              style={{
                background: '#0f172a',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              See Plans
            </button>
          ) : isNativePlatform() ? (
            <button
              onClick={() => window.open('https://play.google.com/store/account/subscriptions', '_blank')}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Manage
            </button>
          ) : null}
        </div>
      </div>

      <button
        id="export-btn"
        onClick={handleExport}
        style={{
          width: '100%',
          background: 'white',
          color: subscriptionStatus === 'pro' ? '#e11d48' : '#0f172a',
          border: subscriptionStatus === 'pro' ? '1px solid #fecdd3' : '1px solid #cbd5e1',
          borderRadius: 'var(--radius-card)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 15,
          fontWeight: 700,
          padding: '18px 24px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'background .15s',
          marginBottom: 16,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = subscriptionStatus === 'pro' ? '#fff1f2' : '#f8fafc'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white'
        }}
      >
        {subscriptionStatus === 'pro' ? 'Export Data for Doctor' : 'Upgrade to Export Data'}
      </button>

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
        onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b' }}
      >
        Sign Out
      </button>

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
          marginTop: 8,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        Delete Account
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', paddingBottom: 8, marginTop: 16 }}>
        Broono v1.0.0 - Your data stays private and on-device.
      </p>
      <div style={{ textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', paddingBottom: 24 }}>
        <a href="/privacy" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'underline' }}>Privacy Policy</a>
        <a href="/terms" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'underline' }}>Terms of Service</a>
      </div>

      <PaywallModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false)
          onRequestUpgrade()
        }}
        featureName="Data export"
      />
    </div>
  )
}
