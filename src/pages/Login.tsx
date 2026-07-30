import { useEffect, useState } from 'react'
import {
    ArrowRight,
    BookOpen,
    Check,
    Droplets,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    Syringe,
    TrendingDown,
    UserRound,
    Weight,
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useStore } from '../store'
import '../landing.css'

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
        if (!isAndroid) return

        const missingKeys: string[] = []
        if (!GOOGLE_CLIENT_ID) missingKeys.push('VITE_GOOGLE_CLIENT_ID')
        if (!googleInitClientId) missingKeys.push('VITE_GOOGLE_ANDROID_CLIENT_ID or VITE_GOOGLE_CLIENT_ID')

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
            if (!isAndroid) throw new Error('Google sign-in is available only in the Android app build.')
            if (!googleAuthReady) throw new Error(googleAuthInitError || 'Google auth is not initialized yet. Check app configuration.')

            const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth')
            const result = await GoogleAuth.signIn()
            const idToken = result.authentication?.idToken

            if (!idToken) throw new Error('Google login failed: missing ID token')

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

    const primaryHref = isAndroid ? '#get-started' : '/waitlist'

    return (
        <div className="landing-page">
            <header className="landing-shell landing-nav">
                <a className="landing-brand" href="/" aria-label="Broono home">
                    <span className="landing-brand-mark" aria-hidden="true"><span>b</span></span>
                    <span className="landing-brand-name">broono<b>.</b></span>
                </a>
                <nav className="landing-nav-links" aria-label="Legal and access links">
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Terms</a>
                    <a href={primaryHref}>{isAndroid ? 'Sign in' : 'Early access'}</a>
                </nav>
            </header>

            <main>
                <section className="landing-shell landing-hero">
                    <div className="landing-copy">
                        <div className="landing-eyebrow">
                            <Sparkles size={14} aria-hidden="true" />
                            Calm, private GLP-1 tracking
                        </div>
                        <h1 className="landing-title">
                            Your progress,<br />made <em>visible.</em>
                        </h1>
                        <p className="landing-lede">
                            Broono brings your weight, dose schedule, hydration, protein goals and private journal into one focused companion — without turning your health journey into another noisy dashboard.
                        </p>
                        <div className="landing-actions">
                            <a className="landing-cta" href={primaryHref}>
                                {isAndroid ? 'Start with Broono' : 'Join the Android launch'}
                                <ArrowRight size={18} aria-hidden="true" />
                            </a>
                            <a className="landing-secondary" href="#app-preview">
                                See the app
                            </a>
                        </div>
                        <div className="landing-proof" aria-label="Product principles">
                            <span><Check size={15} /> Health logs stay on your device</span>
                            <span><Check size={15} /> Built for weekly check-ins</span>
                            <span><Check size={15} /> No clutter</span>
                        </div>
                    </div>

                    <div className="landing-visual" id="app-preview">
                        <div className="landing-glow" aria-hidden="true" />
                        <div className="landing-orbit" aria-hidden="true" />
                        <div className="phone-preview" role="img" aria-label="Preview of the Broono GLP-1 dashboard">
                            <div className="phone-screen">
                                <div className="preview-header">
                                    <div className="preview-brand">
                                        <span className="preview-brand-mark">b</span>
                                        <span>broono<span style={{ color: '#6366f1' }}>.</span></span>
                                    </div>
                                    <span className="preview-avatar"><UserRound size={16} /></span>
                                </div>
                                <div className="preview-body">
                                    <p className="preview-date">Thursday, July 30</p>
                                    <p className="preview-greeting">Good morning.</p>

                                    <div className="preview-card">
                                        <p className="preview-label">Current Weight</p>
                                        <p className="preview-weight">13 st 13 lbs</p>
                                        <div className="preview-chip"><TrendingDown size={12} /> 2 st 4 lbs total</div>
                                    </div>

                                    <div className="preview-card preview-medication">
                                        <div className="preview-med-row">
                                            <div>
                                                <p className="preview-label">Active Medication</p>
                                                <p className="preview-percent">68%</p>
                                            </div>
                                            <div className="preview-dose">
                                                <span>Next Dose</span>
                                                <strong>4 days</strong>
                                            </div>
                                        </div>
                                        <div className="preview-progress"><i /></div>
                                    </div>

                                    <div className="preview-card">
                                        <p className="preview-targets-title">Daily Targets</p>
                                        <div className="preview-target-row">
                                            <span className="preview-target-name">
                                                <span className="preview-target-icon"><Weight size={14} /></span>
                                                Protein
                                            </span>
                                            <span className="preview-target-value">72 / 100g</span>
                                        </div>
                                        <div className="preview-target-bar protein"><i /></div>
                                        <div className="preview-target-row">
                                            <span className="preview-target-name">
                                                <span className="preview-target-icon"><Droplets size={14} /></span>
                                                Water
                                            </span>
                                            <span className="preview-target-value">5 / 8 glasses</span>
                                        </div>
                                        <div className="preview-target-bar water"><i /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="landing-shell landing-feature-strip" aria-label="Broono features">
                    <article className="landing-feature">
                        <span className="landing-feature-icon"><Syringe size={20} /></span>
                        <h2>Know where you are in the week</h2>
                        <p>See your dose timing and estimated medication level at a glance, without digging through dates and notes.</p>
                    </article>
                    <article className="landing-feature">
                        <span className="landing-feature-icon"><TrendingDown size={20} /></span>
                        <h2>See progress without obsessing</h2>
                        <p>Simple weekly logging turns individual weigh-ins into a clearer trend you can actually understand.</p>
                    </article>
                    <article className="landing-feature">
                        <span className="landing-feature-icon"><BookOpen size={20} /></span>
                        <h2>Keep the context that numbers miss</h2>
                        <p>Record symptoms, wins and difficult weeks in a private journal that stays alongside your progress.</p>
                    </article>
                </section>

                <section className="landing-signin-section" id="get-started">
                    <div className="landing-shell landing-signin-grid">
                        <div className="landing-signin-copy">
                            <h2>A health companion should feel trustworthy from the first tap.</h2>
                            <p>
                                Broono is designed around restraint: clear information, deliberate check-ins and local storage for the sensitive health details you enter.
                            </p>
                            <div className="landing-privacy-points">
                                <span><ShieldCheck size={18} /> Health logs are stored locally on your device</span>
                                <span><LockKeyhole size={18} /> Secure Google account access in the Android app</span>
                                <span><Check size={18} /> Clear privacy and consent before onboarding</span>
                            </div>
                        </div>

                        <div className="signin-card">
                            <div className="signin-card-head">
                                <span className="signin-card-icon"><LockKeyhole size={20} /></span>
                                <div>
                                    <h3>{isAndroid ? 'Create your private space' : 'Broono is launching on Android'}</h3>
                                </div>
                            </div>
                            <p className="signin-card-intro">
                                {isAndroid
                                    ? 'Agree to the essentials below, then continue securely with Google. Your weight, dose and journal data remain on this device.'
                                    : 'The full sign-in and tracking experience is available in the Android app. Join the early-access list for launch availability and product updates.'}
                            </p>

                            {isAndroid ? (
                                <>
                                    <div className="consent-list">
                                        <label className="consent-row">
                                            <input
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(event) => setAgreedToTerms(event.target.checked)}
                                            />
                                            <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</span>
                                        </label>
                                        <label className="consent-row">
                                            <input
                                                type="checkbox"
                                                checked={agreedToHealthData}
                                                onChange={(event) => setAgreedToHealthData(event.target.checked)}
                                            />
                                            <span>I understand that the health information I enter is processed and stored locally on this device so Broono can provide its tracking features.</span>
                                        </label>
                                    </div>

                                    {googleAuthInitError && <p className="signin-error">{googleAuthInitError}</p>}
                                    {status === 'error' && <p className="signin-error">{errorMessage}</p>}

                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className="google-signin-btn"
                                        disabled={!agreedToTerms || !agreedToHealthData || status === 'loading' || !googleAuthReady}
                                    >
                                        <span className="google-glyph" aria-hidden="true">G</span>
                                        {status === 'loading' ? 'Connecting securely…' : googleAuthReady ? 'Continue with Google' : 'Preparing secure sign-in…'}
                                    </button>

                                    {REVIEW_GOOGLE_EMAIL && (
                                        <p className="signin-review-note">Review account: {REVIEW_GOOGLE_EMAIL}</p>
                                    )}
                                </>
                            ) : (
                                <div className="web-waitlist-card">
                                    <p>Get early access and know when the Android build is ready for download.</p>
                                    <a href="/waitlist">Join the early-access list <ArrowRight size={16} /></a>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="landing-shell landing-footer-inner">
                    <p>© {new Date().getFullYear()} Broono. A tracking companion, not medical advice.</p>
                    <div className="landing-footer-links">
                        <a href="/privacy">Privacy</a>
                        <a href="/terms">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
