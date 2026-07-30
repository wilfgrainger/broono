import { useEffect, useState } from 'react'
import {
    ArrowRight,
    BookOpen,
    Check,
    Clock3,
    Droplets,
    LockKeyhole,
    ShieldCheck,
    Smartphone,
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
    const primaryLabel = isAndroid ? 'Start with Broono' : 'Get early access'

    return (
        <div className="landing-page">
            <header className="landing-header">
                <div className="landing-shell landing-nav">
                    <a className="landing-brand" href="/" aria-label="Broono home">
                        <span className="landing-brand-mark" aria-hidden="true"><span>b</span></span>
                        <span className="landing-brand-name">broono<b>.</b></span>
                    </a>
                    <nav className="landing-nav-links" aria-label="Legal and access links">
                        <a className="landing-nav-quiet" href="/privacy">Privacy</a>
                        <a className="landing-nav-quiet" href="/terms">Terms</a>
                        <a className="landing-nav-cta" href={primaryHref}>{isAndroid ? 'Sign in' : 'Early access'}</a>
                    </nav>
                </div>
            </header>

            <main>
                <section className="landing-shell landing-hero">
                    <div className="landing-copy">
                        <div className="landing-eyebrow">
                            <Smartphone size={14} aria-hidden="true" />
                            Made for your phone
                        </div>
                        <h1 className="landing-title">
                            A calmer way to follow your <em>GLP-1 week.</em>
                        </h1>
                        <p className="landing-lede">
                            Weight, dose timing, hydration, protein and private notes — organised into one quick check-in that feels natural on a phone.
                        </p>
                        <div className="landing-actions">
                            <a className="landing-cta" href={primaryHref}>
                                {primaryLabel}
                                <ArrowRight size={18} aria-hidden="true" />
                            </a>
                            <a className="landing-secondary" href="#app-preview">
                                Preview the app
                            </a>
                        </div>
                        <p className="landing-action-note">
                            Mobile-first web experience. Sensitive health logs stay on your device.
                        </p>
                        <div className="landing-proof" aria-label="Product principles">
                            <span><Check size={15} aria-hidden="true" /> One-thumb friendly</span>
                            <span><Check size={15} aria-hidden="true" /> Private by design</span>
                            <span><Check size={15} aria-hidden="true" /> Useful in under a minute</span>
                        </div>
                    </div>

                    <div className="landing-visual" id="app-preview">
                        <div className="landing-glow" aria-hidden="true" />
                        <div className="landing-orbit" aria-hidden="true" />
                        <div className="phone-preview" role="img" aria-label="Preview of the Broono mobile GLP-1 dashboard">
                            <div className="phone-screen">
                                <div className="preview-header">
                                    <div className="preview-brand">
                                        <span className="preview-brand-mark">b</span>
                                        <span>broono<span className="preview-brand-dot">.</span></span>
                                    </div>
                                    <span className="preview-avatar"><UserRound size={16} /></span>
                                </div>

                                <div className="preview-body">
                                    <p className="preview-date">Your week</p>
                                    <p className="preview-greeting">You are on track.</p>

                                    <div className="preview-card preview-weight-card">
                                        <div>
                                            <p className="preview-label">Current weight</p>
                                            <p className="preview-weight">13 st 13 lbs</p>
                                        </div>
                                        <div className="preview-chip"><TrendingDown size={12} /> 2 st 4 lbs down</div>
                                    </div>

                                    <div className="preview-card preview-medication">
                                        <div className="preview-med-row">
                                            <div>
                                                <p className="preview-label">Medication level</p>
                                                <p className="preview-percent">68%</p>
                                            </div>
                                            <div className="preview-dose">
                                                <span>Next dose</span>
                                                <strong>4 days</strong>
                                            </div>
                                        </div>
                                        <div className="preview-progress"><i /></div>
                                    </div>

                                    <div className="preview-card preview-targets-card">
                                        <div className="preview-targets-head">
                                            <p className="preview-targets-title">Today</p>
                                            <span>2 goals</span>
                                        </div>
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
                                                <span className="preview-target-icon water"><Droplets size={14} /></span>
                                                Water
                                            </span>
                                            <span className="preview-target-value">5 / 8 glasses</span>
                                        </div>
                                        <div className="preview-target-bar water"><i /></div>
                                    </div>
                                </div>

                                <div className="preview-tab-bar" aria-hidden="true">
                                    <span className="active"><Sparkles size={15} /> Home</span>
                                    <span><TrendingDown size={15} /> Progress</span>
                                    <span><BookOpen size={15} /> Journal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="landing-shell landing-benefits" aria-labelledby="benefits-title">
                    <div className="landing-section-intro">
                        <p>Built for real life</p>
                        <h2 id="benefits-title">The important parts, without the spreadsheet feeling.</h2>
                    </div>
                    <div className="landing-feature-strip">
                        <article className="landing-feature">
                            <span className="landing-feature-icon"><Syringe size={20} aria-hidden="true" /></span>
                            <div>
                                <h3>Know where you are in the week</h3>
                                <p>See dose timing and estimated medication level without digging through dates and notes.</p>
                            </div>
                        </article>
                        <article className="landing-feature">
                            <span className="landing-feature-icon"><TrendingDown size={20} aria-hidden="true" /></span>
                            <div>
                                <h3>See the trend, not every wobble</h3>
                                <p>Simple weekly logging turns individual weigh-ins into progress that is easier to understand.</p>
                            </div>
                        </article>
                        <article className="landing-feature">
                            <span className="landing-feature-icon"><BookOpen size={20} aria-hidden="true" /></span>
                            <div>
                                <h3>Keep the context numbers miss</h3>
                                <p>Record symptoms, wins and difficult weeks in a private journal beside your progress.</p>
                            </div>
                        </article>
                    </div>
                </section>

                <section className="landing-signin-section" id="get-started">
                    <div className="landing-shell landing-signin-grid">
                        <div className="landing-signin-copy">
                            <div className="landing-dark-eyebrow"><Clock3 size={14} aria-hidden="true" /> Short, deliberate check-ins</div>
                            <h2>Designed for a phone, not a desktop dashboard.</h2>
                            <p>
                                Broono keeps the interface focused and the taps obvious, so checking your week does not become another task to manage.
                            </p>
                            <div className="landing-privacy-points">
                                <span><ShieldCheck size={18} aria-hidden="true" /> Health logs stay locally on your device</span>
                                <span><Smartphone size={18} aria-hidden="true" /> Comfortable one-handed layout</span>
                                <span><Check size={18} aria-hidden="true" /> Clear privacy and consent before onboarding</span>
                            </div>
                        </div>

                        <div className="signin-card">
                            <div className="signin-card-head">
                                <span className="signin-card-icon"><LockKeyhole size={20} aria-hidden="true" /></span>
                                <div>
                                    <p className="signin-card-kicker">{isAndroid ? 'Secure access' : 'Mobile early access'}</p>
                                    <h3>{isAndroid ? 'Create your private space' : 'Be first to open Broono on your phone'}</h3>
                                </div>
                            </div>
                            <p className="signin-card-intro">
                                {isAndroid
                                    ? 'Agree to the essentials below, then continue securely with Google. Your weight, dose and journal data remain on this device.'
                                    : 'Join the early-access list for the phone-first web experience and launch updates. The Android app will use the same core product.'}
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
                                    <p>Get launch access and know when the mobile web experience is ready to open.</p>
                                    <a href="/waitlist">Join early access <ArrowRight size={16} aria-hidden="true" /></a>
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

            <div className="landing-mobile-dock">
                <a href={primaryHref}>
                    <span>{primaryLabel}</span>
                    <ArrowRight size={18} aria-hidden="true" />
                </a>
            </div>
        </div>
    )
}
