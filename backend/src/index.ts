import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { SignJWT, importPKCS8, jwtVerify } from 'jose'
import { mapRtdnNotificationTypeToStatus } from './play-rtdn.js'
import { buildVerifySubscriptionResponse, getSubscriptionStatusFromPlayState } from './playVerification.js'

type Bindings = {
  DB: D1Database
  FRONTEND_URL: string
  JWT_SECRET: string
  GOOGLE_AUTH_ALLOWED_EMAILS: string
  GOOGLE_PLAY_PACKAGE_NAME: string
  GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: string
  GOOGLE_PLAY_WEBHOOK_TOKEN: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_ANDROID_CLIENT_ID: string
}

type Variables = {
  user: {
    id: string
    email: string
    sub_status: string
  }
}

type WaitlistEntryRecord = {
  id: string
  email: string
  first_name: string
  created_at: number
  source: string
  notes: string | null
  offer_tier: string
  position: number
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// Enforce strict CORS for the Cloudflare Pages domain (and local dev)
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.FRONTEND_URL,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
  return await corsMiddleware(c, next)
})

app.get('/', (c) => c.text('Broono API Gateway - Active'))

const WAITLIST_LIFETIME_CAP = 100

app.get('/api/waitlist/status', async (c) => {
  const total = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM waitlist_entries'
  ).first<{ total: number | string }>()

  const totalSignups = Number(total?.total ?? 0)
  const spotsRemaining = Math.max(WAITLIST_LIFETIME_CAP - totalSignups, 0)

  return c.json({
    success: true,
    totalSignups,
    lifetimeCap: WAITLIST_LIFETIME_CAP,
    spotsRemaining,
  })
})

app.post('/api/waitlist', async (c) => {
  const body = await c.req.json().catch(() => null) as {
    email?: unknown
    firstName?: unknown
    source?: unknown
    notes?: unknown
  } | null

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : ''
  const source = typeof body?.source === 'string' ? body.source.trim().slice(0, 80) : 'waitlist-web'
  const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 280) : ''

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'A valid email address is required.' }, 400)
  }

  if (!firstName || firstName.length < 2) {
    return c.json({ error: 'Please share your first name.' }, 400)
  }

  if (firstName.length > 80) {
    return c.json({ error: 'First name must be 80 characters or fewer.' }, 400)
  }

  const existingEntry = await c.env.DB.prepare(
    'SELECT * FROM waitlist_entries WHERE email = ?'
  ).bind(email).first<WaitlistEntryRecord>()

  if (existingEntry) {
    const total = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM waitlist_entries'
    ).first<{ total: number | string }>()

    const totalSignups = Number(total?.total ?? existingEntry.position)
    return c.json({
      success: true,
      alreadyJoined: true,
      position: existingEntry.position,
      offerTier: existingEntry.offer_tier,
      awardedLifetimeAccess: existingEntry.offer_tier === 'lifetime',
      spotsRemaining: Math.max(WAITLIST_LIFETIME_CAP - totalSignups, 0),
      totalSignups,
    })
  }

  const total = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM waitlist_entries'
  ).first<{ total: number | string }>()

  const totalSignups = Number(total?.total ?? 0)
  const position = totalSignups + 1
  const offerTier = position <= WAITLIST_LIFETIME_CAP ? 'lifetime' : 'standard'
  const createdAt = Math.floor(Date.now() / 1000)

  await c.env.DB.prepare(
    'INSERT INTO waitlist_entries (id, email, first_name, created_at, source, notes, offer_tier, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    crypto.randomUUID(),
    email,
    firstName,
    createdAt,
    source || 'waitlist-web',
    notes || null,
    offerTier,
    position,
  ).run()

  return c.json({
    success: true,
    alreadyJoined: false,
    position,
    offerTier,
    awardedLifetimeAccess: offerTier === 'lifetime',
    spotsRemaining: Math.max(WAITLIST_LIFETIME_CAP - position, 0),
    totalSignups: position,
  }, 201)
})

// === AUTHENTICATION ===
app.post('/api/auth/send-magic-link', async (c) => {
  return c.json({ error: 'Email sign-in has been retired. Use Google sign-in in the Android app.' }, 410)
})

app.post('/api/auth/verify', async (c) => {
  return c.json({ error: 'Email verification links are no longer supported. Use Google sign-in in the Android app.' }, 410)
})

app.post('/api/auth/google', async (c) => {
  const { idToken } = await c.req.json()
  if (!idToken || typeof idToken !== 'string') {
    return c.json({ error: 'Missing Google ID token' }, 400)
  }

  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
    if (!googleRes.ok) {
      return c.json({ error: 'Invalid Google token' }, 401)
    }

    const payload = await googleRes.json() as {
      aud?: string
      email?: string
      email_verified?: string | boolean
      exp?: string
    }

    const allowedAudiences = [c.env.GOOGLE_CLIENT_ID, c.env.GOOGLE_ANDROID_CLIENT_ID].filter(Boolean)
    if (allowedAudiences.length > 0 && (!payload.aud || !allowedAudiences.includes(payload.aud))) {
      return c.json({ error: 'Google token audience mismatch' }, 401)
    }

    const emailVerified = payload.email_verified === true || payload.email_verified === 'true'
    if (!payload.email || !emailVerified) {
      return c.json({ error: 'Google email is missing or not verified' }, 401)
    }

    const normalizedEmail = payload.email.trim().toLowerCase()
    const allowedEmails = (c.env.GOOGLE_AUTH_ALLOWED_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)

    if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
      return c.json({ error: 'This Google account is not authorized for Broono access.' }, 403)
    }

    const tokenExp = payload.exp ? Number(payload.exp) : 0
    const now = Math.floor(Date.now() / 1000)
    if (tokenExp && tokenExp <= now) {
      return c.json({ error: 'Google token has expired' }, 401)
    }

    let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalizedEmail).first<{ id: string, email: string, subscription_status: string }>()
    if (!user) {
      const userId = crypto.randomUUID()
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, created_at, subscription_status) VALUES (?, ?, ?, ?)'
      ).bind(userId, normalizedEmail, now, 'free').run()
      user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<{ id: string, email: string, subscription_status: string }>()
    }

    if (!c.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is missing.')
    }

    const jwtSecret = new TextEncoder().encode(c.env.JWT_SECRET)
    const authToken = await new SignJWT({ id: user!.id, email: user!.email, sub_status: user!.subscription_status })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(jwtSecret)

    return c.json({
      success: true,
      token: authToken,
      user,
    })
  } catch (err: unknown) {
    const error = err as Error
    console.error('Google auth verification failed:', error)
    return c.json({ error: 'Google auth failed' }, 500)
  }
})

// Middleware for JWT Verification
import type { Context, Next } from 'hono'
const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.split(' ')[1]
  try {
    if (!c.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is missing.')
    }
    const jwtSecret = new TextEncoder().encode(c.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, jwtSecret)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

const GOOGLE_PLAY_ONLY_BILLING_MESSAGE = 'Broono Pro is sold only in the Android app through Google Play.'

app.delete('/api/user', authMiddleware, async (c) => {
  const user = c.get('user') as { id: string; email: string; sub_status: string; }

  if (!user || !user.email) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    // Delete user
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run()

    return c.json({ success: true, message: 'Account deleted successfully' })
  } catch (err: unknown) {
    console.error('Error deleting user', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/stripe/checkout', authMiddleware, async (c) => {
  return c.json({ error: GOOGLE_PLAY_ONLY_BILLING_MESSAGE }, 410)
})

app.post('/api/stripe/webhook', async (c) => {
  return c.json({ error: GOOGLE_PLAY_ONLY_BILLING_MESSAGE }, 410)
})

// === GOOGLE PLAY BILLING (Android) ===

// Allowed product IDs for subscription verification
const ALLOWED_PRODUCT_IDS = ['broono_pro_monthly']


/**
 * Verify a Google Play subscription purchase.
 * The client sends the purchaseToken after a successful Google Play purchase.
 * We verify it with Google's Android Publisher API and update the user's status.
 */
app.post('/api/play/verify-subscription', authMiddleware, async (c) => {
  const user = c.get('user') as { id: string; email: string; sub_status: string }
  const { purchaseToken, productId } = await c.req.json()

  if (!purchaseToken || !productId) {
    return c.json({ error: 'Missing purchaseToken or productId' }, 400)
  }

  // Validate purchaseToken format (alphanumeric with dots, hyphens, underscores)
  if (typeof purchaseToken !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(purchaseToken)) {
    return c.json({ error: 'Invalid purchaseToken format' }, 400)
  }

  // Validate productId against allowlist
  if (!ALLOWED_PRODUCT_IDS.includes(productId)) {
    return c.json({ error: 'Invalid productId' }, 400)
  }

  const packageName = c.env.GOOGLE_PLAY_PACKAGE_NAME || 'app.broono.android'

  try {
    const serviceAccountKey = c.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY
    if (!serviceAccountKey) {
      return c.json({ error: 'Google Play verification is not configured' }, 503)
    }

    let keyData: { private_key?: string; client_email?: string }
    try {
      keyData = JSON.parse(serviceAccountKey)
    } catch {
      return c.json({ error: 'Google Play verification is misconfigured: invalid service account JSON' }, 503)
    }

    if (!keyData.private_key || !keyData.client_email) {
      return c.json({ error: 'Google Play verification is misconfigured: missing private_key or client_email' }, 503)
    }

    let privateKey: CryptoKey
    try {
      privateKey = await importPKCS8(keyData.private_key, 'RS256')
    } catch {
      return c.json({ error: 'Google Play verification is misconfigured: invalid service account private key' }, 503)
    }

    // Create JWT for Google OAuth2
    const now = Math.floor(Date.now() / 1000)
    const googleJwt = await new SignJWT({
      iss: keyData.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .sign(privateKey)

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${googleJwt}`,
    })
    const tokenData = await tokenRes.json() as { access_token: string }

    // Verify the subscription with Google Play Developer API
    const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`
    const verifyRes = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const purchase = await verifyRes.json() as {
      subscriptionState: string
      lineItems?: Array<{ productId: string; expiryTime: string }>
    }

    if (!verifyRes.ok) {
      return c.json(buildVerifySubscriptionResponse(false, 'free'))
    }

    // Check subscription state
    const newStatus = getSubscriptionStatusFromPlayState(purchase.subscriptionState)
    const isActive = newStatus === 'pro'

    await c.env.DB.prepare(
      'UPDATE users SET subscription_status = ?, google_play_token = ? WHERE id = ?'
    ).bind(newStatus, purchaseToken, user.id).run()

    /**
     * Stable client contract for purchase verification responses.
     * Clients should only unlock paid features when:
     *   verified === true && status === 'pro'
     */
    return c.json(buildVerifySubscriptionResponse(isActive, newStatus))
  } catch (err: unknown) {
    const error = err as Error
    console.error('Google Play verification error:', error)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

/**
 * Google Play Real-Time Developer Notifications (RTDN) webhook.
 * Google sends push notifications via Cloud Pub/Sub when subscription state changes.
 *
 * Security: This endpoint verifies the notification came from Google by:
 * 1. Checking the bearer token matches our configured webhook secret
 * 2. Validating the notification structure before processing
 */
app.post('/api/play/webhook', async (c) => {
  // Verify the webhook bearer token (configured in Pub/Sub push subscription)
  const authHeader = c.req.header('Authorization')
  const expectedToken = c.env.GOOGLE_PLAY_WEBHOOK_TOKEN
  if (expectedToken) {
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
  }

  try {
    const body = await c.req.json()
    const { message } = body

    if (!message?.data || typeof message.data !== 'string') {
      return c.json({ error: 'Invalid notification' }, 400)
    }

    // Decode the base64-encoded notification data
    const decodedData = atob(message.data)
    const notification = JSON.parse(decodedData) as {
      subscriptionNotification?: {
        notificationType: number
        purchaseToken: string
        subscriptionId: string
      }
    }

    if (notification.subscriptionNotification) {
      const { notificationType, purchaseToken, subscriptionId } = notification.subscriptionNotification

      // Validate purchaseToken format before using in query
      if (!purchaseToken || typeof purchaseToken !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(purchaseToken)) {
        return c.json({ error: 'Invalid purchase token' }, 400)
      }

      // Map notification type to subscription status
      // See: https://developer.android.com/google/play/billing/rtdn-reference
      const newStatus = mapRtdnNotificationTypeToStatus(notificationType)
      if (!newStatus) {
        console.info('Ignoring unknown Google Play RTDN notification type', {
          notificationType,
          subscriptionId,
        })
        return c.json({ received: true })
      }

      // Update user status by their stored Google Play token
      await c.env.DB.prepare(
        'UPDATE users SET subscription_status = ? WHERE google_play_token = ?'
      ).bind(newStatus, purchaseToken).run()
    }

    return c.json({ received: true })
  } catch (err: unknown) {
    console.error('Play webhook error:', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default app
