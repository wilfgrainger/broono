import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import app from '../src/index.js'
import { mapRtdnNotificationTypeToStatus } from '../src/play-rtdn.js'

type ExecResult = { changes?: number }

class MockStmt {
  constructor(private db: MockDb, private query: string) {}
  bind(...values: unknown[]) {
    this.db.lastBindValues = values
    return this
  }
  async run(): Promise<ExecResult> {
    if (this.query.includes('UPDATE users SET subscription_status')) {
      this.db.updateCount += 1
    }
    return { changes: 1 }
  }
}

class MockDb {
  updateCount = 0
  lastBindValues: unknown[] = []

  prepare(query: string) {
    return new MockStmt(this, query)
  }
}

const fixturesDir = path.join(process.cwd(), 'tests/fixtures')

const knownFixture = JSON.parse(
  readFileSync(path.join(fixturesDir, 'rtdn-known.json'), 'utf-8')
) as { upgrades: number[]; downgrades: number[] }

const unknownFixture = JSON.parse(
  readFileSync(path.join(fixturesDir, 'rtdn-unknown.json'), 'utf-8')
) as { unknown: number[] }

const buildWebhookPayload = (notificationType: number) => {
  const payload = {
    message: {
      data: Buffer.from(
        JSON.stringify({
          subscriptionNotification: {
            notificationType,
            purchaseToken: 'purchase_token_123',
            subscriptionId: 'broono.pro.monthly',
          },
        })
      ).toString('base64'),
    },
  }

  return JSON.stringify(payload)
}

test('maps known RTDN notification types to expected statuses', () => {
  for (const n of knownFixture.upgrades) {
    assert.equal(mapRtdnNotificationTypeToStatus(n), 'pro')
  }

  for (const n of knownFixture.downgrades) {
    assert.equal(mapRtdnNotificationTypeToStatus(n), 'free')
  }
})

test('unknown RTDN notification types return null', () => {
  for (const n of unknownFixture.unknown) {
    assert.equal(mapRtdnNotificationTypeToStatus(n), null)
  }
})

test('webhook ignores unknown RTDN events without mutating subscription status', async () => {
  const db = new MockDb()

  const res = await app.request('http://example.com/api/play/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer webhook-token',
    },
    body: buildWebhookPayload(6),
  }, {
    DB: db as unknown as D1Database,
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'secret',
    RESEND_API_KEY: 'dummy',
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_123',
    STRIPE_PRO_PRICE_ID: 'price_123',
    GOOGLE_PLAY_PACKAGE_NAME: 'com.example.app',
    GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: '{}',
    GOOGLE_PLAY_WEBHOOK_TOKEN: 'webhook-token',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_ANDROID_CLIENT_ID: 'google-android-client-id',
  })

  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { received: true })
  assert.equal(db.updateCount, 0)
})

test('webhook updates subscription status for known downgrade RTDN events', async () => {
  const db = new MockDb()

  const res = await app.request('http://example.com/api/play/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer webhook-token',
    },
    body: buildWebhookPayload(12),
  }, {
    DB: db as unknown as D1Database,
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'secret',
    RESEND_API_KEY: 'dummy',
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_123',
    STRIPE_PRO_PRICE_ID: 'price_123',
    GOOGLE_PLAY_PACKAGE_NAME: 'com.example.app',
    GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: '{}',
    GOOGLE_PLAY_WEBHOOK_TOKEN: 'webhook-token',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_ANDROID_CLIENT_ID: 'google-android-client-id',
  })

  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { received: true })
  assert.equal(db.updateCount, 1)
  assert.equal(db.lastBindValues[0], 'free')
})
