import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export default function Verify() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const setAuth = useStore((s) => s.setAuth)
    const completeOnboarding = useStore((s) => s.completeOnboarding)

    const [error, setError] = useState('')

    useEffect(() => {
        const token = searchParams.get('token')
        const email = searchParams.get('email')

        if (!token || !email) {
            setError('Invalid verification link.')
            return
        }

        const verify = async () => {
            try {
                const res = await fetch(`${API_URL}/api/auth/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, email })
                })

                const data = await res.json()

                if (data.error) throw new Error(data.error)

                // Success - update store and redirect
                setAuth(data.token, data.user.email, data.user.subscription_status)
                completeOnboarding() // They are logged in, effectively onboarded
                navigate('/') // Go to Dashboard
            } catch (err) {
                const error = err as Error
                setError(error.message || 'Verification failed. The link may have expired.')
            }
        }

        verify()
    }, [searchParams, navigate, setAuth, completeOnboarding])

    if (error) {
        return (
            <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: 24, textAlign: 'center' }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#e11d48', marginBottom: 12 }}>Link Expired</h2>
                <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24 }}>{error}</p>
                <button className="btn-primary" onClick={() => navigate('/')}>Return to Login</button>
            </div>
        )
    }

    return (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="logo-icon" style={{ width: 48, height: 48, borderRadius: 16, animation: 'pulse 1.5s infinite' }}>
                <span className="logo-b" style={{ fontSize: 28 }}>b</span>
            </div>
            <p style={{ marginTop: 24, fontSize: 15, fontWeight: 600, color: '#64748b' }}>Verifying your secure link...</p>
        </div>
    )
}
