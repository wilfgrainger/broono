import test from 'node:test'
import assert from 'node:assert/strict'

import app from '../src/index.js'

type ExecResult = { changes?: number }

type UserRecord = {
  id: string
  email: string
  created_at: number
  subscription_status: string
  stripe_customer_id?: string | null
  google_play_token?: string | null
}

type MagicLinkRecord = {
  id: string
  email: string
  token_hash: string
  expires_at: number
  used: number
}

class MemoryStmt {
  values: unknown[] = []

  constructor(private db: MemoryDb, private query: string) {}

  bind(...values: unknown[]) {
    this.values = values
    return this
  }

  async run(): Promise<ExecResult> {
    if (this.query.startsWith('INSERT INTO magic_links')) {
      const [id, email, tokenHash, expiresAt] = this.values as [string, string, string, number]
      this.db.magicLinks.push({ id, email, token_hash: tokenHash, expires_at: expiresAt, used: 0 })
      return { changes: 1 }
    }

    if (this.query.startsWith('UPDATE magic_links SET used = 1 WHERE id = ?')) {
      const [id] = this.values as [string]
      const link = this.db.magicLinks.find((entry) => entry.id === id)
      if (link) link.used = 1
      return { changes: link ? 1 : 0 }
    }

    if (this.query.startsWith('DELETE FROM magic_links WHERE email = ?')) {
      const [email] = this.values as [string]
      const before = this.db.magicLinks.length
      this.db.magicLinks = this.db.magicLinks.filter((entry) => entry.email !== email)
      return { changes: before - this.db.magicLinks.length }
    }

    if (this.query.startsWith('INSERT INTO users')) {
      const [id, email, createdAt, status] = this.values as [string, string, number, string]
      const user: UserRecord = {
        id,
        email,
        created_at: createdAt,
        subscription_status: status,
        stripe_customer_id: null,
        google_play_token: null,
      }
      this.db.usersById.set(id, user)
      this.db.userIdByEmail.set(email, id)
      return { changes: 1 }
    }

    if (this.query.startsWith('DELETE FROM users WHERE id = ?')) {
      const [id] = this.values as [string]
      const user = this.db.usersById.get(id)
      if (!user) return { changes: 0 }

      this.db.usersById.delete(id)
      this.db.userIdByEmail.delete(user.email)
      return { changes: 1 }
    }

    throw new Error(`Unsupported run query: ${this.query}`)
  }

  async first<T>(): Promise<T | null> {
    if (this.query.startsWith('SELECT * FROM magic_links WHERE email = ? AND token_hash = ? AND used = 0')) {
      const [email, tokenHash] = this.values as [string, string]
      const link = this.db.magicLinks.find((entry) =>
        entry.email === email && entry.token_hash === tokenHash && entry.used === 0
      )
      return (link as T | undefined) ?? null
    }

    if (this.query.startsWith('SELECT * FROM users WHERE email = ?')) {
      const [email] = this.values as [string]
      const userId = this.db.userIdByEmail.get(email)
      return (userId ? (this.db.usersById.get(userId) as T | undefined) : undefined) ?? null
    }

    if (this.query.startsWith('SELECT * FROM users WHERE id = ?')) {
      const [id] = this.values as [string]
      return (this.db.usersById.get(id) as T | undefined) ?? null
    }

    throw new Error(`Unsupported first query: ${this.query}`)
  }
}

class MemoryDb {
  magicLinks: MagicLinkRecord[] = []
  usersById = new Map<string, UserRecord>()
  userIdByEmail = new Map<string, string>()

  prepare(query: string) {
    return new MemoryStmt(this, query)
  }
}

const createEnv = (db: MemoryDb) => ({
  DB: db as unknown as D1Database,
  FRONTEND_URL: 'http://localhost:3000',
  JWT_SECRET: 'secret',
  RESEND_API_KEY: 'capture',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_123',
  STRIPE_PRO_PRICE_ID: 'price_123',
  GOOGLE_PLAY_PACKAGE_NAME: 'app.broono.android',
  GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: '{}',
  GOOGLE_PLAY_WEBHOOK_TOKEN: 'webhook-token',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_ANDROID_CLIENT_ID: 'google-android-client-id',
})

const hashToken = async (token: string) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(hashBuffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

test('send magic link normalizes email and generates a capturable magic link', async () => {
  const db = new MemoryDb()
  const sentLinks = new Map<string, string>()
  const originalFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    if (url === 'https://api.resend.com/emails') {
      const payload = JSON.parse(String(init?.body ?? '{}')) as { to?: string | string[]; html?: string }
      const email = Array.isArray(payload.to) ? payload.to[0] : payload.to
      const match = payload.html?.match(/href="([^"]+)"/)
      if (email && match?.[1]) {
        sentLinks.set(email, match[1])
      }

      return new Response(JSON.stringify({ id: 'email_test_123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    return originalFetch(input, init)
  }

  try {
    const res = await app.request('http://example.com/api/auth/send-magic-link', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify({ email: 'USER@Example.COM ' }),
    }, createEnv(db))

    assert.equal(res.status, 200)
    assert.deepEqual(await res.json(), { success: true, message: 'Magic link generated' })
    assert.equal(db.magicLinks.length, 1)
    assert.equal(db.magicLinks[0]?.email, 'user@example.com')
    assert.match(sentLinks.get('user@example.com') ?? '', /verify\?token=.*email=user%40example\.com/)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('send magic link rate limits repeated attempts from the same client', async () => {
  const db = new MemoryDb()
  const env = createEnv(db)
  env.RESEND_API_KEY = 'dummy'

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const res = await app.request('http://example.com/api/auth/send-magic-link', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.11',
      },
      body: JSON.stringify({ email: 'limit@example.com' }),
    }, env)

    assert.equal(res.status, 200)
  }

  const limited = await app.request('http://example.com/api/auth/send-magic-link', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.11',
    },
    body: JSON.stringify({ email: 'limit@example.com' }),
  }, env)

  assert.equal(limited.status, 429)
  assert.deepEqual(await limited.json(), {
    error: 'Too many sign-in attempts. Please wait 15 minutes and try again.',
  })
})

test('verify consumes a valid magic link and creates a user', async () => {
  const db = new MemoryDb()
  const email = 'verify@example.com'
  const token = 'valid-token'
  const tokenHash = await hashToken(token)

  db.magicLinks.push({
    id: 'magic-1',
    email,
    token_hash: tokenHash,
    expires_at: Math.floor(Date.now() / 1000) + 60,
    used: 0,
  })

  const res = await app.request('http://example.com/api/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, token }),
  }, createEnv(db))

  const payload = await res.json() as {
    success: boolean
    token: string
    user: UserRecord
  }

  assert.equal(res.status, 200)
  assert.equal(payload.success, true)
  assert.ok(payload.token)
  assert.equal(payload.user.email, email)
  assert.equal(db.magicLinks[0]?.used, 1)
  assert.equal(db.userIdByEmail.has(email), true)
})

test('delete account removes backend records for the authenticated user', async () => {
  const db = new MemoryDb()
  const email = 'delete@example.com'
  const token = 'delete-token'
  const tokenHash = await hashToken(token)

  db.magicLinks.push({
    id: 'magic-2',
    email,
    token_hash: tokenHash,
    expires_at: Math.floor(Date.now() / 1000) + 60,
    used: 0,
  })

  const verifyRes = await app.request('http://example.com/api/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, token }),
  }, createEnv(db))

  const verifyPayload = await verifyRes.json() as { token: string; user: UserRecord }

  const deleteRes = await app.request('http://example.com/api/user', {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${verifyPayload.token}`,
    },
  }, createEnv(db))

  assert.equal(deleteRes.status, 200)
  assert.equal(db.userIdByEmail.has(email), false)
  assert.equal(db.usersById.has(verifyPayload.user.id), false)
  assert.equal(db.magicLinks.some((entry) => entry.email === email), false)
})
