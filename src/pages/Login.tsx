import { useEffect, useState } from 'react'
import { Lock, Smartphone } from 'lucide-react'
import { useStore } from '../store'
import { Capacitor } from '@capacitor/core'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || ''
const GOOGLE_ANDROID_CLIENT_ID = import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID?.trim() || ''
const REVIEW_GOOGLE_EMAIL = import.meta.env.VITE_REVIEW_GOOGLE_EMAIL?.trim() || ''

export default function Login() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('Google sign-in failed. Please try again.')
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [agreedToHealthData, setAgreedToHealthData] = useState(false)
    const [googleAuthReady, setGoogleAuthReady] = useState(false)
    const [googleAuthInitError, setGoogleAuthInitError] = useState<string | null>(null)
    const setAuth = useStore((state) => state.setAuth)
    const isAndroid = Capacitor.getPlatform() === 'android'
    const googleInitClientId = (isAndroid && GOOGLE_ANDROID_CLIENT_ID) ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_CLIENT_ID

    useEffect(() => {
        if (!isAndroid) {
            return
        }

        const missingKeys: string[] = []
        if (!GOOGLE_CLIENT_ID) {
            missingKeys.push('VITE_GOOGLE_CLIENT_ID')
        }

        if (!googleInitClientId) {
            missingKeys.push('VITE_GOOGLE_ANDROID_CLIENT_ID or VITE_GOOGLE_CLIENT_ID')
        }

        if (missingKeys.length > 0) {
            const message = `Google auth misconfigured. Missing: ${missingKeys.join(', ')}`
            console.error(message)
            setGoogleAuthInitError(message)
            setGoogleAuthReady(false)
            return
        }

        const initializeGoogleAuth = async () => {
            try {
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
                await GoogleAuth.initialize({ clientId: googleInitClientId })
                setGoogleAuthReady(true)
                setGoogleAuthInitError(null)
            } catch (err) {
                const message = 'Google auth failed to initialize. Check OAuth client IDs and signing fingerprints.'
                console.error(message, err)
                setGoogleAuthInitError(message)
                setGoogleAuthReady(false)
            }
        }

        void initializeGoogleAuth()
    }, [googleInitClientId, isAndroid])

    const handleGoogleLogin = async () => {
        if (!agreedToTerms || !agreedToHealthData) return

        setStatus('loading')
        setErrorMessage('Google sign-in failed. Please try again.')

        try {
            if (!isAndroid) {
                throw new Error('Google sign-in is available only in the Android app build.')
            }

            if (!googleAuthReady) {
                throw new Error(googleAuthInitError || 'Google auth is not initialized yet. Check app configuration.')
            }

            const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
            const result = await GoogleAuth.signIn()
            const idToken = result.authentication?.idToken

            if (!idToken) {
                throw new Error('Google login failed: missing ID token')
            }

            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            })
            const data = await res.json()

            if (data.success && data.token && data.user?.email) {
                setAuth(data.token, data.user.email, data.user.subscription_status)
                return
            }

            throw new Error(data.error || 'Google login failed')
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.'
            console.error(message, err)
            setErrorMessage(message)
            setStatus('error')
        }
    }

    return (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div className="logo-wrap" style={{ justifyContent: 'center', marginBottom: 16, transform: 'scale(1.2)' }}>
                    <div className="logo-icon" style={{ width: 40, height: 40, borderRadius: 14 }}>
                        <span className="logo-b" style={{ fontSize: 24 }}>b</span>
                    </div>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>broono.</h1>
                <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>Your GLP-1 companion.</p>
            </div>

            <div className="card" style={{ width: '100%', maxWidth: 420 }}>
                <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                }}>
                    <Lock size={18} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.5, margin: 0 }}>
                        <strong>100% Private.</strong> Your health data, weight, and logs are stored <em>locally on your device only</em>. We never see or store your health data on our servers.
                    </p>
                </div>

                <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px 16px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                }}>
                    <Smartphone size={18} color="#0f172a" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 4 }}>
                            Google sign-in only
                        </p>
                        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                            Broono sign-in is handled through Google in the Android app build.
                        </p>
                        {REVIEW_GOOGLE_EMAIL && (
                            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: '8px 0 0' }}>
                                Review account: <strong>{REVIEW_GOOGLE_EMAIL}</strong>
                            </p>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            style={{ marginTop: 2, accentColor: '#0f172a' }}
                        />
                        <span>I agree to the Terms of Service and Privacy Policy.</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={agreedToHealthData}
                            onChange={(e) => setAgreedToHealthData(e.target.checked)}
                            style={{ marginTop: 2, accentColor: '#0f172a' }}
                        />
                        <span>I understand that my health data is stored locally on my device and I consent to this data processing to use the app (UK GDPR compliance).</span>
                    </label>
                </div>

                {status === 'error' && (
                    <p style={{ color: '#e11d48', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>{errorMessage}</p>
                )}

                {isAndroid ? (
                    <>
                        {googleAuthInitError && (
                            <p style={{ color: '#e11d48', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>{googleAuthInitError}</p>
                        )}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="btn-primary"
                            disabled={!agreedToTerms || !agreedToHealthData || status === 'loading' || !googleAuthReady}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: '#0f172a',
                                opacity: (!agreedToTerms || !agreedToHealthData || status === 'loading' || !googleAuthReady) ? 0.6 : 1,
                            }}
                        >
                            {status === 'loading' ? 'Connecting...' : 'Continue with Google'}
                        </button>
                    </>
                ) : (
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                        Sign-in is available in the Android app build only. Legal pages remain accessible on web.
                    </p>
                )}
            </div>
        </div>
    )
}
