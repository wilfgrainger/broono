import { createServer } from 'node:http'
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as typeof globalThis.crypto
}

const { default: app } = await import('../../backend/dist-test/src/index.js')

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

type ExecResult = { changes?: number }

class MemoryStmt {
  private values: unknown[] = []
  private db: MemoryDb
  private query: string

  constructor(db: MemoryDb, query: string) {
    this.db = db
    this.query = query
  }

  bind(...values: unknown[]) {
    this.values = values
    return this
  }

  async run(): Promise<ExecResult> {
    if (this.query.startsWith('INSERT INTO magic_links')) {
      const [id, email, tokenHash, expiresAt] = this.values as [string, string, string, number]
      this.db.magicLinks.push({
        id,
        email,
        token_hash: tokenHash,
        expires_at: expiresAt,
        used: 0,
      })
      return { changes: 1 }
    }

    if (this.query.startsWith('UPDATE magic_links SET used = 1 WHERE id = ?')) {
      const [id] = this.values as [string]
      const link = this.db.magicLinks.find((entry) => entry.id === id)
      if (link) {
        link.used = 1
      }
      return { changes: link ? 1 : 0 }
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

    if (this.query.startsWith('DELETE FROM magic_links WHERE email = ?')) {
      const [email] = this.values as [string]
      const before = this.db.magicLinks.length
      this.db.magicLinks = this.db.magicLinks.filter((entry) => entry.email !== email)
      return { changes: before - this.db.magicLinks.length }
    }

    if (this.query.startsWith('DELETE FROM users WHERE id = ?')) {
      const [id] = this.values as [string]
      const user = this.db.usersById.get(id)
      if (!user) return { changes: 0 }

      this.db.usersById.delete(id)
      this.db.userIdByEmail.delete(user.email)
      return { changes: 1 }
    }

    throw new Error(`Unsupported run query in test DB: ${this.query}`)
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

    throw new Error(`Unsupported first query in test DB: ${this.query}`)
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

const db = new MemoryDb()
const capturedMagicLinks = new Map<string, string>()
const originalFetch = globalThis.fetch.bind(globalThis)

globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url

  if (url === 'https://api.resend.com/emails') {
    const payload = JSON.parse(String(init?.body ?? '{}')) as {
      to?: string | string[]
      html?: string
    }
    const email = Array.isArray(payload.to) ? payload.to[0] : payload.to
    const match = payload.html?.match(/href="([^"]+)"/)
    if (email && match?.[1]) {
      capturedMagicLinks.set(email, match[1])
    }

    return new Response(JSON.stringify({ id: 'email_test_123' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }

  return originalFetch(input, init)
}

const env = {
  DB: db as unknown as D1Database,
  FRONTEND_URL: 'http://127.0.0.1:4173',
  JWT_SECRET: 'e2e-secret',
  RESEND_API_KEY: 'capture',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_123',
  STRIPE_PRO_PRICE_ID: 'price_123',
  GOOGLE_PLAY_PACKAGE_NAME: 'app.broono.android',
  GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: '{}',
  GOOGLE_PLAY_WEBHOOK_TOKEN: 'webhook-token',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_ANDROID_CLIENT_ID: '',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1:8787')

  if (url.pathname === '/_test/magic-link') {
    const email = url.searchParams.get('email') ?? ''
    const magicLink = capturedMagicLinks.get(email)

    if (!magicLink) {
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'Magic link not found' }))
      return
    }

    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ email, url: magicLink }))
    return
  }

  if (url.pathname === '/_test/user') {
    const email = url.searchParams.get('email') ?? ''
    const userId = db.userIdByEmail.get(email)
    const user = userId ? db.usersById.get(userId) : null

    if (!user) {
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'User not found' }))
      return
    }

    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify(user))
    return
  }

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const request = new Request(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks),
  })

  const response = await app.fetch(request, env)

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
  res.end(Buffer.from(await response.arrayBuffer()))
})

server.listen(8787, '127.0.0.1', () => {
  console.log('E2E backend listening on http://127.0.0.1:8787')
})
