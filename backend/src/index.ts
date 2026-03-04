import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import { cors } from 'hono/cors'
import { SignJWT, jwtVerify } from 'jose'
import Stripe from 'stripe'

type Bindings = {
  DB: D1Database
  FRONTEND_URL: string
  JWT_SECRET: string
  RESEND_API_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PRO_PRICE_ID: string
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

app.get('/', (c) => c.json({ status: 'Broono API Gateway - Active' }))

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
    message: 'Magic link generated', 
    dev_link: !c.env.RESEND_API_KEY || c.env.RESEND_API_KEY === 'dummy' ? magicLink : undefined 
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

// === PAYMENTS (STRIPE) ===

// Middleware for JWT Verification
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
  const user = c.get('user') as Variables['user']

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
  const user = c.get('user') as Variables['user']
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
    console.error('Stripe error', err)
    const error = err as Error
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
    const error = err as Error
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

export default app
