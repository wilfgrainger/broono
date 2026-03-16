import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { SignJWT, importPKCS8, jwtVerify } from 'jose'
import Stripe from 'stripe'
import { mapRtdnNotificationTypeToStatus } from './play-rtdn.js'

type Bindings = {
  DB: D1Database
  FRONTEND_URL: string
  JWT_SECRET: string
  RESEND_API_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRO_PRICE_ID: string
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

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// Enforce strict CORS for the Cloudflare Pages domain (and local dev)
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.FRONTEND_URL,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
  return await corsMiddleware(c, next)
})

app.get('/', (c) => c.text('Broono API Gateway - Active'))

// === AUTHENTICATION ===
app.post('/api/auth/send-magic-link', async (c) => {
  const { email } = await c.req.json()
  if (!email || !email.includes('@')) {
    return c.json({ error: 'Invalid email' }, 400)
  }

  // Generate secure random token
  const tokenBytes = new Uint8Array(32)
  crypto.getRandomValues(tokenBytes)
  const token = Array.from(tokenBytes, b => b.toString(16).padStart(2, '0')).join('')

  // Hash token for storage
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const tokenHash = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('')

  // Store in D1
  const id = crypto.randomUUID()
  const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60) // 15 mins
  
  await c.env.DB.prepare(
    'INSERT INTO magic_links (id, email, token_hash, expires_at) VALUES (?, ?, ?, ?)'
  ).bind(id, email, tokenHash, expiresAt).run()

  // In local dev, we don't really want to spam Resend unless configured
  const magicLink = `${c.env.FRONTEND_URL}/verify?token=${token}&email=${encodeURIComponent(email)}`
  
  if (c.env.RESEND_API_KEY && c.env.RESEND_API_KEY !== 'dummy') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Broono <login@broono.app>', // Updated to .app domain
        to: email,
        subject: 'Sign in to Broono',
        html: `<p>Click the link below to sign in to your Broono account:</p><p><a href="${magicLink}">Sign in to Broono</a></p><p>This link expires in 15 minutes.</p>`
      })
    })
    
    if (!res.ok) {
      console.error('Resend error', await res.text())
      return c.json({ error: 'Failed to send email' }, 500)
    }
  }

  return c.json({ 
    success: true, 
    message: 'Magic link generated'
  })
})

app.post('/api/auth/verify', async (c) => {
  const { email, token } = await c.req.json()
  if (!email || !token) return c.json({ error: 'Missing credentials' }, 400)

  // Hash the incoming token
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  const tokenHash = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('')

  // Check magic link in D1
  const link = await c.env.DB.prepare(
    'SELECT * FROM magic_links WHERE email = ? AND token_hash = ? AND used = 0'
  ).bind(email, tokenHash).first<{ expires_at: number, id: string }>()

  if (!link) return c.json({ error: 'Invalid or expired link' }, 401)

  const now = Math.floor(Date.now() / 1000)
  if (now > link.expires_at) {
    return c.json({ error: 'Link has expired' }, 401)
  }

  // Mark token used
  await c.env.DB.prepare('UPDATE magic_links SET used = 1 WHERE id = ?').bind(link.id).run()

  // Get or Create User
  let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<{ id: string, email: string, subscription_status: string }>()
  if (!user) {
    const userId = crypto.randomUUID()
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, created_at, subscription_status) VALUES (?, ?, ?, ?)'
    ).bind(userId, email, now, 'free').run()
    user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<{ id: string, email: string, subscription_status: string }>()
  }

  // Mint JWT
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
    user
  })
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

    const tokenExp = payload.exp ? Number(payload.exp) : 0
    const now = Math.floor(Date.now() / 1000)
    if (tokenExp && tokenExp <= now) {
      return c.json({ error: 'Google token has expired' }, 401)
    }

    let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(payload.email).first<{ id: string, email: string, subscription_status: string }>()
    if (!user) {
      const userId = crypto.randomUUID()
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, created_at, subscription_status) VALUES (?, ?, ?, ?)'
      ).bind(userId, payload.email, now, 'free').run()
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

// === PAYMENTS (STRIPE) ===

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

app.delete('/api/user', authMiddleware, async (c) => {
  const user = c.get('user') as { id: string; email: string; sub_status: string; }

  if (!user || !user.email) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    // Delete magic links
    await c.env.DB.prepare('DELETE FROM magic_links WHERE email = ?').bind(user.email).run()
    // Delete user
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run()

    return c.json({ success: true, message: 'Account deleted successfully' })
  } catch (err: unknown) {
    console.error('Error deleting user', err)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post('/api/stripe/checkout', authMiddleware, async (c) => {
  const user = c.get('user') as { id: string; email: string; sub_status: string; }
  const { email } = await c.req.json()
  
  if (!c.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is missing.')
  }

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion
  })

  // Set up the mock price ID if configuring locally
  const priceId = c.env.STRIPE_PRO_PRICE_ID || 'price_1Q_fake_id_for_local'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${c.env.FRONTEND_URL}/profile?checkout=success`,
      cancel_url: `${c.env.FRONTEND_URL}/profile?checkout=canceled`,
      client_reference_id: user.id,
      customer_email: email,
    })

    return c.json({ url: session.url })
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Stripe error', error)
    return c.json({ error: error.message }, 500)
  }
})

app.post('/api/stripe/webhook', async (c) => {
  if (!c.env.STRIPE_SECRET_KEY || !c.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe environment variables are missing.')
  }

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion
  })
  const signature = c.req.header('stripe-signature')
  
  if (!signature) return c.json({ error: 'Missing signature' }, 400)

  let event;
  try {
    const body = await c.req.text()
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Webhook signature verification failed:`, error.message)
    return c.json({ error: `Webhook Error: ${error.message}` }, 400)
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        
        if (userId) {
          await c.env.DB.prepare(
            'UPDATE users SET subscription_status = ?, stripe_customer_id = ? WHERE id = ?'
          ).bind('pro', customerId, userId).run()
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'pro' : 'free';
        await c.env.DB.prepare(
          'UPDATE users SET subscription_status = ? WHERE stripe_customer_id = ?'
        ).bind(status, subscription.customer as string).run()
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await c.env.DB.prepare(
          'UPDATE users SET subscription_status = ? WHERE stripe_customer_id = ?'
        ).bind('free', subscription.customer as string).run()
        break;
      }
    }
  } catch(e) {
      console.error('Error processing webhook event', e)
  }

  return c.json({ received: true })
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
      return c.json({ error: 'Failed to verify purchase with Google' }, 400)
    }

    // Check subscription state
    const isActive = purchase.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ||
                     purchase.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
    const newStatus = isActive ? 'pro' : 'free'

    await c.env.DB.prepare(
      'UPDATE users SET subscription_status = ?, google_play_token = ? WHERE id = ?'
    ).bind(newStatus, purchaseToken, user.id).run()

    return c.json({ success: true, status: newStatus, verified: true })
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
