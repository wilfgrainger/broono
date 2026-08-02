import {
    ArrowRight,
    BookOpen,
    Check,
    Clock3,
    Droplets,
    HardDrive,
    LockKeyhole,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Syringe,
    TrendingDown,
    UserRound,
    Weight,
} from 'lucide-react'
import { useStore } from '../store'
import '../landing.css'

export default function Login() {
    const startLocally = useStore((state) => state.startLocally)

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
                        <a className="landing-nav-cta" href="#get-started">Start locally</a>
                    </nav>
                </div>
            </header>

            <main>
                <section className="landing-shell landing-hero">
                    <div className="landing-copy">
                        <div className="landing-eyebrow">
                            <Smartphone size={14} aria-hidden="true" />
                            Local-only on your phone
                        </div>
                        <h1 className="landing-title">
                            A calmer way to follow your <em>GLP-1 week.</em>
                        </h1>
                        <p className="landing-lede">
                            Weight, dose timing, hydration, protein and private notes — organised into one quick check-in without an account, cloud database or health-data upload.
                        </p>
                        <div className="landing-actions">
                            <a className="landing-cta" href="#get-started">
                                Start on this device
                                <ArrowRight size={18} aria-hidden="true" />
                            </a>
                            <a className="landing-secondary" href="#app-preview">
                                Preview the app
                            </a>
                        </div>
                        <p className="landing-action-note">
                            No sign-in. No tracking account. Your entries stay in this browser or app installation.
                        </p>
                        <div className="landing-proof" aria-label="Product principles">
                            <span><Check size={15} aria-hidden="true" /> No account</span>
                            <span><Check size={15} aria-hidden="true" /> No health-data server</span>
                            <span><Check size={15} aria-hidden="true" /> Free local features</span>
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
                                <p>See dose timing and an estimated medication curve without digging through dates and notes.</p>
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
                            <h2>Designed for a phone, not a cloud account.</h2>
                            <p>
                                Broono stores your profile, logs and journal in local device storage. The application does not need a backend to work.
                            </p>
                            <div className="landing-privacy-points">
                                <span><ShieldCheck size={18} aria-hidden="true" /> Health logs stay on this device</span>
                                <span><HardDrive size={18} aria-hidden="true" /> Export your own data whenever you choose</span>
                                <span><Smartphone size={18} aria-hidden="true" /> Comfortable one-handed layout</span>
                            </div>
                        </div>

                        <div className="signin-card">
                            <div className="signin-card-head">
                                <span className="signin-card-icon"><LockKeyhole size={20} aria-hidden="true" /></span>
                                <div>
                                    <p className="signin-card-kicker">Private local setup</p>
                                    <h3>Create your space on this device</h3>
                                </div>
                            </div>
                            <p className="signin-card-intro">
                                There is no account to create. Starting Broono writes only to this browser or installed app. Clearing site/app data erases the information.
                            </p>
                            <button
                                type="button"
                                onClick={startLocally}
                                className="google-signin-btn"
                            >
                                Start using Broono
                                <ArrowRight size={18} aria-hidden="true" />
                            </button>
                            <p className="signin-review-note">
                                By continuing, you acknowledge that Broono is a personal tracker and not medical advice.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="landing-shell landing-footer-inner">
                    <p>© {new Date().getFullYear()} Broono. Local-only tracking, not medical advice.</p>
                    <div className="landing-footer-links">
                        <a href="/privacy">Privacy</a>
                        <a href="/terms">Terms</a>
                    </div>
                </div>
            </footer>

            <div className="landing-mobile-dock">
                <a href="#get-started">
                    <span>Start on this device</span>
                    <ArrowRight size={18} aria-hidden="true" />
                </a>
            </div>
        </div>
    )
}
