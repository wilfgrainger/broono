import { useState } from 'react'
import { useStore } from '../store'
import { purchaseSubscription, restorePurchases, MONTHLY_PRICE, TRIAL_DAYS, isNativePlatform, PRODUCT_ID } from '../services/billing'
import { Crown, Shield, Star, Check } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'


type VerificationResponse = {
    verified?: boolean
    status?: string
}

type VerificationResult = {
    success: boolean
    errorMessage?: string
}

const features = [
    'Unlimited check-ins & weight logging',
    'Full progress charts & insights',
    'Journal with AI-powered reflections',
    'Personalized medication tracking',
    'Data export for your doctor',
]

export default function Paywall() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const setAuth = useStore((s) => s.setAuth)
    const authToken = useStore((s) => s.authToken)
    const userEmail = useStore((s) => s.userEmail)


    const verifySubscription = async (purchaseToken: string, productId: string): Promise<VerificationResult> => {
        if (!authToken) {
            return { success: false, errorMessage: 'Sign in again to verify your subscription.' }
        }

        setError('Purchase received, verifying with Google Play...')

        try {
            const res = await fetch(`${API_URL}/api/play/verify-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ purchaseToken, productId }),
            })

            const data = (await res.json()) as VerificationResponse
            const isActive = ['active', 'trial', 'in_grace_period'].includes((data.status || '').toLowerCase())

            if (res.ok && data.verified === true && isActive) {
                return { success: true }
            }

            return {
                success: false,
                errorMessage: 'Purchase received, but we could not verify an active subscription yet. Please try Restore Purchases in a moment.',
            }
        } catch {
            return {
                success: false,
                errorMessage: 'Purchase received, but verification is pending. Please check your connection and tap Restore Purchases.',
            }
        }
    }

    const handleSubscribe = async () => {
        setLoading(true)
        setError(null)

        if (isNativePlatform()) {
            // Android: Use Google Play Billing + backend verification
            const result = await purchaseSubscription()
            if (result.success && result.purchaseToken) {
                const verification = await verifySubscription(result.purchaseToken, result.productId || PRODUCT_ID)
                if (verification.success) {
                    if (authToken && userEmail) {
                        setAuth(authToken, userEmail, 'pro')
                    }
                    setError(null)
                } else {
                    setError(verification.errorMessage || 'Purchase verification failed. Please try Restore Purchases.')
                }
            } else if (result.error && result.error !== 'Purchase cancelled') {
                setError(result.error)
            }
        } else {
            // Web: Use Stripe checkout
            try {
                const res = await fetch(`${API_URL}/api/stripe/checkout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({ email: userEmail }),
                })
                const data = await res.json()
                if (data.url && typeof data.url === 'string' && data.url.startsWith('https://')) {
                    window.location.href = data.url
                } else {
                    setError('Failed to start checkout')
                }
            } catch {
                setError('Network error. Please try again.')
            }
        }

        setLoading(false)
    }

    const handleRestore = async () => {
        setLoading(true)
        setError(null)

        const info = await restorePurchases()
        if ((info.status === 'pro' || info.status === 'trial') && info.purchaseToken) {
            const verification = await verifySubscription(info.purchaseToken, info.productId || PRODUCT_ID)
            if (verification.success) {
                if (authToken && userEmail) {
                    setAuth(authToken, userEmail, 'pro')
                }
                setError(null)
            } else {
                setError(verification.errorMessage || 'Purchase verification failed. Please try Restore Purchases.')
            }
        } else if (info.status === 'pro' || info.status === 'trial') {
            setError('Subscription found, but verification data is unavailable. Please try again shortly.')
        } else {
            setError('No active subscription found.')
        }

        setLoading(false)
    }

    return (
        <div className="page-enter" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 24,
            background: 'linear-gradient(180deg, #f0f9ff 0%, #F8FAFC 50%)',
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                    width: 72,
                    height: 72,
                    background: 'linear-gradient(135deg, #005b7f, #0891b2)',
                    borderRadius: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 32px rgba(0, 91, 127, 0.25)',
                }}>
                    <Crown size={36} color="white" strokeWidth={2} />
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.5px' }}>
                    Unlock Broono Pro
                </h1>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, maxWidth: 320 }}>
                    Your complete GLP-1 companion with full tracking and insights.
                </p>
            </div>

            {/* Features */}
            <div style={{
                width: '100%',
                maxWidth: 400,
                background: 'white',
                borderRadius: 16,
                padding: '24px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
                marginBottom: 24,
            }}>
                {features.map((feature, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom: i < features.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}>
                        <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: '#f0fdf4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Check size={16} color="#16a34a" strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{feature}</span>
                    </div>
                ))}
            </div>

            {/* Pricing card */}
            <div style={{
                width: '100%',
                maxWidth: 400,
                background: 'linear-gradient(135deg, #005b7f, #0891b2)',
                borderRadius: 16,
                padding: 24,
                color: 'white',
                textAlign: 'center',
                marginBottom: 16,
                boxShadow: '0 8px 32px rgba(0, 91, 127, 0.3)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                    <Star size={18} color="#fbbf24" fill="#fbbf24" />
                    <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {TRIAL_DAYS}-Day Free Trial
                    </span>
                    <Star size={18} color="#fbbf24" fill="#fbbf24" />
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 4 }}>
                    {MONTHLY_PRICE}<span style={{ fontSize: 16, fontWeight: 500, opacity: 0.8 }}>/month</span>
                </div>
                <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>
                    Try free for {TRIAL_DAYS} days. Cancel anytime.
                </p>
                <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: 'white',
                        color: '#005b7f',
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 16,
                        fontWeight: 800,
                        cursor: loading ? 'wait' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'transform 0.15s, opacity 0.15s',
                        fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseDown={(e) => { if (!loading) (e.currentTarget).style.transform = 'scale(0.97)' }}
                    onMouseUp={(e) => { (e.currentTarget).style.transform = 'scale(1)' }}
                >
                    {loading ? 'Processing...' : `Start Free Trial`}
                </button>
            </div>

            {error && (
                <p style={{ color: '#e11d48', fontSize: 13, fontWeight: 500, textAlign: 'center', marginBottom: 8 }}>
                    {error}
                </p>
            )}

            {/* Restore purchases (Android) */}
            {isNativePlatform() && (
                <button
                    onClick={handleRestore}
                    disabled={loading}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '12px 16px',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    Restore Purchases
                </button>
            )}

            {/* Legal */}
            <div style={{ textAlign: 'center', marginTop: 16, maxWidth: 360 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                    <Shield size={14} color="#94a3b8" />
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Secure payment</span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                    {TRIAL_DAYS}-day free trial, then {MONTHLY_PRICE}/month. Cancel anytime in{' '}
                    {isNativePlatform() ? 'Google Play settings' : 'your account settings'}.
                    By subscribing you agree to our{' '}
                    <a href="/privacy" style={{ color: '#64748b' }}>Privacy Policy</a> and{' '}
                    <a href="/terms" style={{ color: '#64748b' }}>Terms of Service</a>.
                </p>
            </div>
        </div>
    )
}
