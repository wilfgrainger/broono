import test from 'node:test'
import assert from 'node:assert/strict'

import app from '../src/index.js'

type ExecResult = { changes?: number }

type UserRecord = {
  id: string
  email: string
  created_at: number
  subscription_status: string
  google_play_token?: string | null
}

type WaitlistRecord = {
  id: string
  email: string
  first_name: string
  created_at: number
  source: string
  notes: string | null
  offer_tier: string
  position: number
}

class MemoryStmt {
  values: unknown[] = []

  constructor(private db: MemoryDb, private query: string) {}

  bind(...values: unknown[]) {
    this.values = values
    return this
  }

  async run(): Promise<ExecResult> {
    if (this.query.startsWith('INSERT INTO users')) {
      const [id, email, createdAt, status] = this.values as [string, string, number, string]
      const user: UserRecord = {
        id,
        email,
        created_at: createdAt,
        subscription_status: status,
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

    if (this.query.startsWith('INSERT INTO waitlist_entries')) {
      const [id, email, firstName, createdAt, source, notes, offerTier, position] = this.values as [
        string,
        string,
        string,
        number,
        string,
        string | null,
        string,
        number,
      ]

      const entry: WaitlistRecord = {
        id,
        email,
        first_name: firstName,
        created_at: createdAt,
        source,
        notes,
        offer_tier: offerTier,
        position,
      }

      this.db.waitlistByEmail.set(email, entry)
      this.db.waitlistCount = Math.max(this.db.waitlistCount, position)
      return { changes: 1 }
    }

    throw new Error(`Unsupported run query: ${this.query}`)
  }

  async first<T>(): Promise<T | null> {
    if (this.query.startsWith('SELECT * FROM users WHERE email = ?')) {
      const [email] = this.values as [string]
      const userId = this.db.userIdByEmail.get(email)
      return (userId ? (this.db.usersById.get(userId) as T | undefined) : undefined) ?? null
    }

    if (this.query.startsWith('SELECT * FROM users WHERE id = ?')) {
      const [id] = this.values as [string]
      return (this.db.usersById.get(id) as T | undefined) ?? null
    }

    if (this.query.startsWith('SELECT * FROM waitlist_entries WHERE email = ?')) {
      const [email] = this.values as [string]
      return (this.db.waitlistByEmail.get(email) as T | undefined) ?? null
    }

    if (this.query.startsWith('SELECT COUNT(*) as total FROM waitlist_entries')) {
      return { total: this.db.waitlistCount } as T
    }

    throw new Error(`Unsupported first query: ${this.query}`)
  }
}

class MemoryDb {
  usersById = new Map<string, UserRecord>()
  userIdByEmail = new Map<string, string>()
  waitlistByEmail = new Map<string, WaitlistRecord>()
  waitlistCount = 0

  prepare(query: string) {
    return new MemoryStmt(this, query)
  }
}

const createEnv = (db: MemoryDb) => ({
  DB: db as unknown as D1Database,
  FRONTEND_URL: 'http://localhost:3000',
  JWT_SECRET: 'secret',
  GOOGLE_AUTH_ALLOWED_EMAILS: '',
  GOOGLE_PLAY_PACKAGE_NAME: 'app.broono.android',
  GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: '{}',
  GOOGLE_PLAY_WEBHOOK_TOKEN: 'webhook-token',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_ANDROID_CLIENT_ID: 'google-android-client-id',
})

const originalFetch = globalThis.fetch.bind(globalThis)

const mockGoogleTokenInfo = async <T>(
  payloads: Record<string, { aud?: string; email?: string; email_verified?: string | boolean; exp?: string }>,
  run: () => Promise<T>,
) => {
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

    if (url.startsWith('https://oauth2.googleapis.com/tokeninfo')) {
      const token = new URL(url).searchParams.get('id_token') ?? ''
      const payload = payloads[token]

      if (!payload) {
        return new Response(JSON.stringify({ error: 'invalid_token' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    return originalFetch(input, init)
  }

  try {
    return await run()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('legacy email sign-in is disabled', async () => {
  const db = new MemoryDb()
  const res = await app.request('http://example.com/api/auth/send-magic-link', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' }),
  }, createEnv(db))

  assert.equal(res.status, 410)
  assert.deepEqual(await res.json(), {
    error: 'Email sign-in has been retired. Use Google sign-in in the Android app.',
  })
})

test('legacy email verification is disabled', async () => {
  const db = new MemoryDb()
  const res = await app.request('http://example.com/api/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', token: 'unused' }),
  }, createEnv(db))

  assert.equal(res.status, 410)
  assert.deepEqual(await res.json(), {
    error: 'Email verification links are no longer supported. Use Google sign-in in the Android app.',
  })
})

test('google auth creates a user and returns an auth token', async () => {
  const db = new MemoryDb()

  await mockGoogleTokenInfo({
    'google-token-valid': {
      aud: 'google-client-id',
      email: 'BROONO-TEST-LOGIN@gmail.com',
      email_verified: true,
      exp: String(Math.floor(Date.now() / 1000) + 3600),
    },
  }, async () => {
    const res = await app.request('http://example.com/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: 'google-token-valid' }),
    }, createEnv(db))

    const payload = await res.json() as { success: boolean; token: string; user: UserRecord }

    assert.equal(res.status, 200)
    assert.equal(payload.success, true)
    assert.ok(payload.token)
    assert.equal(payload.user.email, 'broono-test-login@gmail.com')
    assert.equal(db.userIdByEmail.has('broono-test-login@gmail.com'), true)
  })
})

test('google auth rejects email addresses outside the allowlist', async () => {
  const db = new MemoryDb()
  const env = createEnv(db)
  env.GOOGLE_AUTH_ALLOWED_EMAILS = 'broono-test-login@gmail.com'

  await mockGoogleTokenInfo({
    'google-token-blocked': {
      aud: 'google-client-id',
      email: 'someoneelse@gmail.com',
      email_verified: true,
      exp: String(Math.floor(Date.now() / 1000) + 3600),
    },
  }, async () => {
    const res = await app.request('http://example.com/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: 'google-token-blocked' }),
    }, env)

    assert.equal(res.status, 403)
    assert.deepEqual(await res.json(), {
      error: 'This Google account is not authorized for Broono access.',
    })
  })
})

test('delete account removes backend records for the authenticated Google user', async () => {
  const db = new MemoryDb()

  await mockGoogleTokenInfo({
    'google-token-delete': {
      aud: 'google-client-id',
      email: 'delete@example.com',
      email_verified: true,
      exp: String(Math.floor(Date.now() / 1000) + 3600),
    },
  }, async () => {
    const authRes = await app.request('http://example.com/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: 'google-token-delete' }),
    }, createEnv(db))

    const authPayload = await authRes.json() as { token: string; user: UserRecord }

    const deleteRes = await app.request('http://example.com/api/user', {
      method: 'DELETE',
      headers: {
        authorization: `Bearer ${authPayload.token}`,
      },
    }, createEnv(db))

    assert.equal(deleteRes.status, 200)
    assert.equal(db.userIdByEmail.has('delete@example.com'), false)
    assert.equal(db.usersById.has(authPayload.user.id), false)
  })
})

test('stripe checkout is disabled because billing is Google Play only', async () => {
  const db = new MemoryDb()

  await mockGoogleTokenInfo({
    'google-token-billing': {
      aud: 'google-client-id',
      email: 'billing@example.com',
      email_verified: true,
      exp: String(Math.floor(Date.now() / 1000) + 3600),
    },
  }, async () => {
    const authRes = await app.request('http://example.com/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: 'google-token-billing' }),
    }, createEnv(db))

    const authPayload = await authRes.json() as { token: string }

    const checkoutRes = await app.request('http://example.com/api/stripe/checkout', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${authPayload.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email: 'billing@example.com' }),
    }, createEnv(db))

    assert.equal(checkoutRes.status, 410)
    assert.deepEqual(await checkoutRes.json(), {
      error: 'Broono Pro is sold only in the Android app through Google Play.',
    })
  })
})

test('waitlist awards lifetime access to the first 100 signups', async () => {
  const db = new MemoryDb()

  for (let i = 1; i <= 100; i += 1) {
    const res = await app.request('http://example.com/api/waitlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: `person${i}@example.com`,
        firstName: `Person${i}`,
        source: 'unit-test',
      }),
    }, createEnv(db))

    assert.equal(res.status, 201)
  }

  const res = await app.request('http://example.com/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'vip@example.com',
      firstName: 'Vip',
      source: 'unit-test',
    }),
  }, createEnv(db))

  const payload = await res.json() as {
    position: number
    awardedLifetimeAccess: boolean
    offerTier: string
  }

  assert.equal(res.status, 201)
  assert.equal(payload.position, 101)
  assert.equal(payload.awardedLifetimeAccess, false)
  assert.equal(payload.offerTier, 'standard')
})

test('waitlist reuses an existing position for duplicate emails', async () => {
  const db = new MemoryDb()

  const firstResponse = await app.request('http://example.com/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'repeat@example.com',
      firstName: 'Repeat',
      source: 'unit-test',
    }),
  }, createEnv(db))

  const secondResponse = await app.request('http://example.com/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'repeat@example.com',
      firstName: 'Repeat',
      source: 'unit-test',
    }),
  }, createEnv(db))

  const firstPayload = await firstResponse.json() as { position: number; alreadyJoined: boolean }
  const secondPayload = await secondResponse.json() as { position: number; alreadyJoined: boolean }

  assert.equal(firstPayload.position, 1)
  assert.equal(secondPayload.position, 1)
  assert.equal(secondPayload.alreadyJoined, true)
  assert.equal(db.waitlistCount, 1)
})
