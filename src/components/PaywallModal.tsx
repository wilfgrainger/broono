import { Rocket, ShieldCheck, FileText, ArrowRight } from 'lucide-react'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
  featureName: string
}

export default function PaywallModal({ isOpen, onClose, onUpgrade, featureName }: PaywallModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="card scale-in"
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'white',
          padding: '32px 24px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close upgrade modal"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 24,
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          &times;
        </button>

        <div style={{ width: 56, height: 56, background: '#e0f2fe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Rocket size={28} color="#0284c7" strokeWidth={2} />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0f172a' }}>
          Unlock Broono Pro
        </h2>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.5, marginBottom: 24 }}>
          <strong>{featureName}</strong> is part of Broono Pro. Free users keep access to core tracking, settings, and account controls.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ marginTop: 2 }}><FileText size={18} color="#0f172a" /></div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Detailed progress insights</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>Unlock charts, trends, and a richer history view.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ marginTop: 2 }}><ShieldCheck size={18} color="#0f172a" /></div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Unlimited private history</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>Keep longer journals and export summaries for care visits.</p>
            </div>
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={onUpgrade}
          style={{ width: '100%', padding: '18px' }}
        >
          See Upgrade Options <ArrowRight size={18} />
        </button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}
