import { useState } from 'react'
import { useStore } from '../store'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function Login() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [devLink, setDevLink] = useState('')
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [agreedToHealthData, setAgreedToHealthData] = useState(false)
    const setAuth = useStore((state) => state.setAuth)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.includes('@')) return

        setStatus('loading')

        try {
            const res = await fetch(`${API_URL}/api/auth/send-magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            const data = await res.json()
            if (data.success) {
                setStatus('success')
                if (data.dev_link) setDevLink(data.dev_link)
            } else {
                setStatus('error')
            }
        } catch (err) {
            console.error(err)
            setStatus('error')
        }
    }

    if (status === 'success') {
        return (
            <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4L12 14.01l-3-3"></path></svg>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Check your email</h2>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6 }}>
                    We sent a magic link to <strong>{email}</strong>. Click it to log in securely.
                </p>

                {devLink && (
                    <div style={{ marginTop: 40, padding: 16, background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', textAlign: 'left', wordBreak: 'break-all' }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#b45309', marginBottom: 8 }}>DEV MODE LINK:</p>
                        <a href={devLink} style={{ fontSize: 13, color: '#0369a1', textDecoration: 'underline' }}>{devLink}</a>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div className="logo-wrap" style={{ justifyContent: 'center', marginBottom: 16, transform: 'scale(1.2)' }}>
                    <div className="logo-icon" style={{ width: 40, height: 40, borderRadius: 14 }}>
                        <span className="logo-b" style={{ fontSize: 24 }}>b</span>
                    </div>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>broono.</h1>
                <p style={{ fontSize: 15, color: '#64748b', marginTop: 8 }}>Your GLP-1 companion.</p>
            </div>

            <div className="card" style={{ width: '100%', maxWidth: 400 }}>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            style={{ fontSize: 15, padding: '14px 16px' }}
                            disabled={status === 'loading'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
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
                            <span>I consent to the processing of my health data for the purposes of providing this service (UK GDPR compliance).</span>
                        </label>
                    </div>

                    {status === 'error' && (
                        <p style={{ color: '#e11d48', fontSize: 13, fontWeight: 500 }}>Failed to send magic link. Please try again.</p>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!email || !agreedToTerms || !agreedToHealthData || status === 'loading'}
                        style={{ width: '100%', padding: '16px', opacity: (!email || !agreedToTerms || !agreedToHealthData || status === 'loading') ? 0.6 : 1 }}
                    >
                        {status === 'loading' ? 'Sending...' : 'Continue with Email'}
                    </button>
                </form>
            </div>
        </div>
    )
}
