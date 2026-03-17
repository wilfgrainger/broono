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
  google_play_token?: string | null
}

type ExecResult = { changes?: number }

class MemoryStmt {
  private values: unknown[] = []

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

    throw new Error(`Unsupported run query in test DB: ${this.query}`)
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

    throw new Error(`Unsupported first query in test DB: ${this.query}`)
  }
}

class MemoryDb {
  usersById = new Map<string, UserRecord>()
  userIdByEmail = new Map<string, string>()

  prepare(query: string) {
    return new MemoryStmt(this, query)
  }
}

const db = new MemoryDb()
const originalFetch = globalThis.fetch.bind(globalThis)

globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url

  if (url.startsWith('https://oauth2.googleapis.com/tokeninfo')) {
    const idToken = new URL(url).searchParams.get('id_token') ?? ''
    const email = idToken.startsWith('e2e-google:')
      ? idToken.slice('e2e-google:'.length).trim().toLowerCase()
      : ''

    if (!email) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      aud: 'google-client-id',
      email,
      email_verified: true,
      exp: String(Math.floor(Date.now() / 1000) + 3600),
    }), {
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
  GOOGLE_AUTH_ALLOWED_EMAILS: '',
  GOOGLE_PLAY_PACKAGE_NAME: 'app.broono.android',
  GOOGLE_PLAY_SERVICE_ACCOUNT_KEY: '{}',
  GOOGLE_PLAY_WEBHOOK_TOKEN: 'webhook-token',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_ANDROID_CLIENT_ID: 'google-android-client-id',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1:8787')

  if (url.pathname === '/_test/google-auth' && req.method === 'POST') {
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }

    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as { email?: string }
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'email is required' }))
      return
    }

    const request = new Request('http://127.0.0.1:8787/api/auth/google', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken: `e2e-google:${email}` }),
    })

    const response = await app.fetch(request, env)
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()))
    res.end(Buffer.from(await response.arrayBuffer()))
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
