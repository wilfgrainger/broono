import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, Gift, Rocket, ShieldCheck, Smartphone } from 'lucide-react'

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

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T
  } catch {
    throw new Error('Broono returned an unexpected response. Please try again.')
  }
}

export default function Waitlist() {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<WaitlistStatusResponse | null>(null)
  const [statusUnavailable, setStatusUnavailable] = useState(false)
  const [result, setResult] = useState<WaitlistJoinResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/waitlist/status`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!response.ok) {
          throw new Error('Unable to load waitlist status right now.')
        }
        const data = await readJson<WaitlistStatusResponse>(response)
        setStatus(data)
        setStatusUnavailable(false)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error(err)
        setStatusUnavailable(true)
      }
    }

    void loadStatus()
    return () => controller.abort()
  }, [])

  const spotsRemaining = result?.spotsRemaining ?? status?.spotsRemaining
  const totalSignups = result?.totalSignups ?? status?.totalSignups
  const headline = useMemo(() => {
    if (typeof spotsRemaining !== 'number') {
      return `The first ${WAITLIST_CAP} eligible early-access members receive lifetime Pro access.`
    }

    if (spotsRemaining > 0) {
      return `First ${WAITLIST_CAP} early-access members get free lifetime access.`
    }

    return 'Early access is open — new signups join in order and get launch updates.'
  }, [spotsRemaining])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!acceptedPrivacy) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          email,
          notes,
          source: 'broono-waitlist-page',
        }),
      })

      const data = await readJson<WaitlistJoinResponse & { error?: string }>(response)
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to join the waitlist right now.')
      }

      setResult(data)
      setStatus({
        success: true,
        totalSignups: data.totalSignups,
        lifetimeCap: WAITLIST_CAP,
        spotsRemaining: data.spotsRemaining,
      })
      setStatusUnavailable(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to join the waitlist right now.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="waitlist-page page-enter">
      <nav className="waitlist-nav" aria-label="Waitlist navigation">
        <a className="waitlist-brand" href="/" aria-label="Broono home">
          <span className="waitlist-brand-mark" aria-hidden="true">b</span>
          <span>broono<span style={{ color: '#6366f1' }}>.</span></span>
        </a>
        <a className="waitlist-back-link" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to overview
        </a>
      </nav>

      <main className="waitlist-shell">
        <section className="waitlist-hero">
          <div className="waitlist-badge">Phone-first web app • Android companion • one shared product</div>
          <h1>A calmer GLP-1 companion, designed for your phone.</h1>
          <p>
            Join Broono early access for launch updates, first access to the mobile web experience and — for the first 100 eligible people —
            <strong> free lifetime Pro access.</strong>
          </p>

          {typeof spotsRemaining === 'number' && typeof totalSignups === 'number' ? (
            <div className="waitlist-stats" aria-label="Current early-access availability">
              <div className="waitlist-stat-card">
                <Gift size={18} aria-hidden="true" />
                <div>
                  <strong>{Math.max(spotsRemaining, 0)}</strong>
                  <span>lifetime spots left</span>
                </div>
              </div>
              <div className="waitlist-stat-card">
                <Rocket size={18} aria-hidden="true" />
                <div>
                  <strong>{totalSignups}</strong>
                  <span>people on the list</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="waitlist-status-placeholder" role="status">
              {!statusUnavailable && <span className="waitlist-status-dot" aria-hidden="true" />}
              {statusUnavailable
                ? 'Live availability is temporarily unavailable. You can still join safely.'
                : 'Checking current early-access availability…'}
            </div>
          )}

          <div className="waitlist-benefits">
            <div className="waitlist-benefit">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Private by design — health logs stay on-device.</span>
            </div>
            <div className="waitlist-benefit">
              <Smartphone size={18} aria-hidden="true" />
              <span>Built for phone browsers, with the Android app using the same shared core.</span>
            </div>
          </div>
        </section>

        <section className="waitlist-form-card card" aria-labelledby="waitlist-form-title">
          <div className="waitlist-copy-block">
            <p className="waitlist-eyebrow">Early-access offer</p>
            <h2 id="waitlist-form-title">{headline}</h2>
            <p>
              Eligible members in the first 100 positions will have their account tagged for lifetime access when Broono Pro opens.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="waitlist-form">
            <label htmlFor="waitlist-first-name">
              First name
              <input
                id="waitlist-first-name"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Taylor"
                autoComplete="given-name"
                maxLength={80}
                required
              />
            </label>
            <label htmlFor="waitlist-email">
              Email
              <input
                id="waitlist-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                required
              />
            </label>
            <label htmlFor="waitlist-notes">
              What would make Broono a must-have for you?
              <textarea
                id="waitlist-notes"
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                maxLength={280}
                placeholder="Ex: progress insights, side-effect tracking, journaling, or accountability."
              />
            </label>

            <label className="waitlist-consent">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                required
              />
              <span>
                I agree that Broono may store my name, email and optional feedback to manage early access, as described in the{' '}
                <a href="/privacy">Privacy Policy</a>.
              </span>
            </label>

            <button
              type="submit"
              className="btn-primary waitlist-submit"
              disabled={loading || !acceptedPrivacy}
            >
              {loading ? 'Saving your spot…' : 'Join early access'}
            </button>
          </form>

          <div aria-live="polite" aria-atomic="true">
            {error && <p className="waitlist-feedback waitlist-feedback-error" role="alert">{error}</p>}

            {result && (
              <div className="waitlist-success" role="status">
                <h3>{result.alreadyJoined ? 'You are already on the list.' : 'You are on the list.'}</h3>
                <p>
                  Spot <strong>#{result.position}</strong>.{' '}
                  {result.awardedLifetimeAccess
                    ? 'You qualified for free lifetime Pro access.'
                    : 'You will still receive launch updates and the next available onboarding invite.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <p className="waitlist-home-note">
        Broono is a personal tracking companion, not medical advice. Speak to a qualified clinician about treatment decisions.
      </p>
    </div>
  )
}
