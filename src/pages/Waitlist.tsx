import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Gift, Rocket, ShieldCheck, Smartphone } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const WAITLIST_CAP = 100

interface WaitlistStatusResponse {
  success: boolean
  totalSignups: number
  lifetimeCap: number
  spotsRemaining: number
}

interface WaitlistJoinResponse {
  success: boolean
  alreadyJoined: boolean
  position: number
  offerTier: 'lifetime' | 'standard'
  awardedLifetimeAccess: boolean
  spotsRemaining: number
  totalSignups: number
  error?: string
}

export default function Waitlist() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<WaitlistStatusResponse | null>(null)
  const [result, setResult] = useState<WaitlistJoinResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/waitlist/status`)
        if (!res.ok) {
          throw new Error('Unable to load waitlist status right now.')
        }
        const data = await res.json() as WaitlistStatusResponse
        setStatus(data)
      } catch (err) {
        console.error(err)
      }
    }

    void loadStatus()
  }, [])

  const spotsRemaining = result?.spotsRemaining ?? status?.spotsRemaining ?? WAITLIST_CAP
  const totalSignups = result?.totalSignups ?? status?.totalSignups ?? 0
  const headline = useMemo(() => {
    if (spotsRemaining > 0) {
      return `First ${WAITLIST_CAP} waitlist members get free lifetime access.`
    }

    return 'Waitlist is open — new signups join in order and get launch updates.'
  }, [spotsRemaining])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          email,
          notes,
          source: 'broono-waitlist-page',
        }),
      })

      const data = await res.json() as WaitlistJoinResponse & { error?: string }
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to join the waitlist right now.')
      }

      setResult(data)
      setStatus({
        success: true,
        totalSignups: data.totalSignups,
        lifetimeCap: WAITLIST_CAP,
        spotsRemaining: data.spotsRemaining,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to join the waitlist right now.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="waitlist-shell page-enter">
      <section className="waitlist-hero">
        <div className="waitlist-badge">Android first • iPhone next • one shared product</div>
        <h1>Launch-ready GLP-1 support, built for mobile from day one.</h1>
        <p>
          Join the Broono waitlist to get launch updates, early access, and — for the first 100 people —
          <strong> free lifetime Pro access.</strong>
        </p>

        <div className="waitlist-stats">
          <div className="waitlist-stat-card">
            <Gift size={18} />
            <div>
              <strong>{Math.max(spotsRemaining, 0)}</strong>
              <span>lifetime spots left</span>
            </div>
          </div>
          <div className="waitlist-stat-card">
            <Rocket size={18} />
            <div>
              <strong>{totalSignups}</strong>
              <span>people on the list</span>
            </div>
          </div>
        </div>

        <div className="waitlist-benefits">
          <div className="waitlist-benefit">
            <ShieldCheck size={18} />
            <span>Private by design — health logs stay on-device.</span>
          </div>
          <div className="waitlist-benefit">
            <Smartphone size={18} />
            <span>Android launch first, then iPhone with the same shared core app.</span>
          </div>
        </div>
      </section>

      <section className="waitlist-form-card card">
        <div className="waitlist-copy-block">
          <p className="waitlist-eyebrow">Waitlist offer</p>
          <h2>{headline}</h2>
          <p>
            If you land in the first 100, we will tag your account for lifetime access when Broono Pro opens.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="waitlist-form">
          <label>
            First name
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Taylor"
              maxLength={80}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            What would make Broono a must-have for you?
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              maxLength={280}
              placeholder="Ex: progress insights, side-effect tracking, journaling, or accountability."
            />
          </label>

          <button type="submit" className="btn-primary waitlist-submit" disabled={loading}>
            {loading ? 'Saving your spot...' : 'Join the waitlist'}
          </button>
        </form>

        {error && <p className="waitlist-feedback waitlist-feedback-error">{error}</p>}

        {result && (
          <div className="waitlist-success">
            <h3>{result.alreadyJoined ? 'You are already on the list.' : 'You are on the list.'}</h3>
            <p>
              Spot <strong>#{result.position}</strong>.{' '}
              {result.awardedLifetimeAccess
                ? 'You qualified for free lifetime Pro access.'
                : 'You will still receive launch updates and the next available onboarding invite.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
