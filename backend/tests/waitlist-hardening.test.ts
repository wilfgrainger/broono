import test from 'node:test'
import assert from 'node:assert/strict'

import app from '../src/index.js'

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

class WaitlistStmt {
  private values: unknown[] = []

  constructor(private db: WaitlistDb, private query: string) {}

  bind(...values: unknown[]) {
    this.values = values
    return this
  }

  async first<T>(): Promise<T | null> {
    if (this.query.startsWith('SELECT COUNT(*) as total FROM waitlist_entries')) {
      return { total: this.db.entries.size } as T
    }

    if (this.query.startsWith('SELECT * FROM waitlist_entries WHERE email = ?')) {
      const [email] = this.values as [string]
      return (this.db.entries.get(email) as T | undefined) ?? null
    }

    throw new Error(`Unsupported first query: ${this.query}`)
  }

  async run(): Promise<{ changes: number }> {
    if (!this.query.startsWith('INSERT INTO waitlist_entries')) {
      throw new Error(`Unsupported run query: ${this.query}`)
    }

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

    this.db.entries.set(email, {
      id,
      email,
      first_name: firstName,
      created_at: createdAt,
      source,
      notes,
      offer_tier: offerTier,
      position,
    })

    return { changes: 1 }
  }
}

class WaitlistDb {
  entries = new Map<string, WaitlistRecord>()

  prepare(query: string) {
    return new WaitlistStmt(this, query)
  }
}

const createEnv = (db: WaitlistDb) => ({
  DB: db as unknown as D1Database,
  FRONTEND_URL: 'https://broono.app',
  JWT_SECRET: 'test-secret',
  GOOGLE_AUTH_ALLOWED_EMAILS: '',
  GOOGLE_PLAY_PACKAGE_NAME: 'app.broono.android',
  GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: '{}',
  GOOGLE_PLAY_WEBHOOK_TOKEN: 'webhook-token',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_ANDROID_CLIENT_ID: 'google-android-client-id',
})

test('waitlist ignores free-text fields at the API boundary', async () => {
  const db = new WaitlistDb()
  const response = await app.request('https://api.broono.app/api/waitlist', {
    method: 'POST',
    headers: {
      origin: 'https://broono.app',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'Taylor',
      email: 'taylor@example.com',
      source: 'unit-test',
      notes: 'This should never be persisted.',
    }),
  }, createEnv(db))

  assert.equal(response.status, 201)
  assert.equal(db.entries.get('taylor@example.com')?.notes, null)
})

test('waitlist rejects oversized request bodies', async () => {
  const db = new WaitlistDb()
  const response = await app.request('https://api.broono.app/api/waitlist', {
    method: 'POST',
    headers: {
      origin: 'https://broono.app',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      firstName: 'Taylor',
      email: 'taylor@example.com',
      ignored: 'x'.repeat(17 * 1024),
    }),
  }, createEnv(db))

  assert.equal(response.status, 413)
  assert.deepEqual(await response.json(), { error: 'Request body is too large.' })
  assert.equal(db.entries.size, 0)
})

test('API responses include defensive cache and browser headers', async () => {
  const db = new WaitlistDb()
  const response = await app.request('https://api.broono.app/api/waitlist/status', {
    headers: { origin: 'https://broono.app' },
  }, createEnv(db))

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
  assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()')
})
