import { useState } from 'react'
import { Rocket, ShieldCheck, FileText, ArrowRight } from 'lucide-react'
import { useStore } from '../store'

const API_URL = 'http://localhost:8787'

interface PaywallModalProps {
    isOpen: boolean
    onClose: () => void
    featureName: string
}

export default function PaywallModal({ isOpen, onClose, featureName }: PaywallModalProps) {
    const { authToken, userEmail } = useStore((s) => ({ authToken: s.authToken, userEmail: s.userEmail }))
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleUpgrade = async () => {
        if (!authToken) return
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ email: userEmail })
            })
            const data = await res.json()
            if (data.url) {
                if (data.url.startsWith('https://checkout.stripe.com/')) {
                    window.location.href = data.url
                } else {
                    throw new Error('Invalid checkout URL returned from server')
                }
            } else {
                throw new Error(data.error || 'Failed to start checkout')
            }
        } catch (err) {
            console.error(err)
            alert('Checkout is currently unavailable.')
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="card scale-in" style={{
                width: '100%',
                maxWidth: 420,
                background: 'white',
                padding: '32px 24px',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 24, color: '#94a3b8', cursor: 'pointer' }}
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
                    <strong>{featureName}</strong> is a Premium feature. Upgrade to Pro to unlock the full potential of your GLP-1 journey.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ marginTop: 2 }}><FileText size={18} color="#0f172a" /></div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Unlimited Journaling</p>
                            <p style={{ fontSize: 13, color: '#64748b' }}>Track every non-scale victory.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ marginTop: 2 }}><ShieldCheck size={18} color="#0f172a" /></div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Doctor Export Reports</p>
                            <p style={{ fontSize: 13, color: '#64748b' }}>Generate secure PDFs for your physician.</p>
                        </div>
                    </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Pro Subscription</p>
                        <p style={{ fontSize: 12, color: '#64748b' }}>Cancel anytime.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>$4<span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>/mo</span></p>
                    </div>
                </div>

                <button
                    className="btn-primary"
                    onClick={handleUpgrade}
                    disabled={loading}
                    style={{ width: '100%', padding: '18px', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Routing to Stripe...' : 'Upgrade Now'} <ArrowRight size={18} />
                </button>
            </div>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}
