type BroonoKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

type Env = {
  BROONO_STATE?: BroonoKv;
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string;
};

type JsonRecord = Record<string, unknown>;

const defaultAllowedOrigins = ['https://broono.app', 'https://www.broono.app'];
const maxSyncBodyBytes = 64 * 1024;
const userIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

const securityHeaders = {
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

const parseAllowedOrigins = (env: Env) => (
  env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? defaultAllowedOrigins
);

const requestOriginAllowed = (request: Request, env: Env) => {
  const origin = request.headers.get('origin');
  if (!origin) return undefined;
  const allowedOrigins = parseAllowedOrigins(env);
  return allowedOrigins.includes(origin) ? origin : null;
};

const corsHeadersFor = (request: Request, env: Env) => {
  const allowedOrigin = requestOriginAllowed(request, env);
  return {
    ...(allowedOrigin ? { 'access-control-allow-origin': allowedOrigin, vary: 'Origin' } : {}),
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    'access-control-max-age': '86400',
  };
};

const responseHeadersFor = (request: Request, env: Env) => ({
  ...securityHeaders,
  ...corsHeadersFor(request, env),
  'cache-control': 'no-store',
});

const json = (request: Request, env: Env, body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
  ...init,
  headers: { 'content-type': 'application/json', ...responseHeadersFor(request, env), ...(init?.headers ?? {}) },
});

const stateKeyFor = (userId: string) => `state:${userId}`;

const isValidUserId = (userId: string) => userIdPattern.test(userId);

const validateUserId = (userId: string | undefined | null) => {
  const normalized = userId?.trim() || 'guest';
  return isValidUserId(normalized) ? normalized : undefined;
};

const userIdFrom = (state: unknown, request: Request) => {
  if (typeof state === 'object' && state && 'user' in state) {
    const user = (state as { user?: { id?: unknown } }).user;
    if (typeof user?.id === 'string') return validateUserId(user.id);
  }

  const url = new URL(request.url);
  return validateUserId(url.searchParams.get('userId'));
};

const readJsonBody = async (request: Request): Promise<JsonRecord | undefined> => {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? '0');
    if (contentLength > maxSyncBodyBytes) return undefined;
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maxSyncBodyBytes) return undefined;
    const body = JSON.parse(rawBody) as unknown;
    return typeof body === 'object' && body !== null && !Array.isArray(body) ? body as JsonRecord : undefined;
  } catch {
    return undefined;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      const allowedOrigin = requestOriginAllowed(request, env);
      return new Response(null, {
        status: allowedOrigin === null ? 403 : 204,
        headers: { ...securityHeaders, ...corsHeadersFor(request, env) },
      });
    }

    if (requestOriginAllowed(request, env) === null) {
      return json(request, env, { ok: false, error: 'Origin not allowed' }, { status: 403 });
    }

    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return json(request, env, { ok: true, service: 'broono-api', environment: env.ENVIRONMENT ?? 'production' });
    }

    if (url.pathname === '/sync' && request.method === 'POST') {
      const state = await readJsonBody(request);
      if (!state) return json(request, env, { ok: false, error: 'Expected JSON object body under 64KB' }, { status: 400 });

      const userId = userIdFrom(state, request);
      if (!userId) return json(request, env, { ok: false, error: 'Invalid user id' }, { status: 400 });

      await env.BROONO_STATE?.put(stateKeyFor(userId), JSON.stringify(state));
      return json(request, env, { ok: true, state, userId, syncedAt: Date.now(), persisted: Boolean(env.BROONO_STATE) });
    }

    if (url.pathname === '/sync' && request.method === 'GET') {
      const userId = validateUserId(url.searchParams.get('userId'));
      if (!userId) return json(request, env, { ok: false, error: 'Invalid user id' }, { status: 400 });

      const raw = await env.BROONO_STATE?.get(stateKeyFor(userId));
      const state = raw ? await readStoredState(raw) : null;
      return json(request, env, { ok: true, userId, state, persisted: Boolean(env.BROONO_STATE) });
    }

    if (url.pathname.startsWith('/leaderboard/')) {
      return json(request, env, { ok: true, scope: url.pathname.split('/').pop(), rows: [] });
    }

    return json(request, env, { ok: false, error: 'Not found' }, { status: 404 });
  },
};

const readStoredState = async (raw: string) => {
  try {
    return JSON.parse(raw) as JsonRecord;
  } catch {
    return null;
  }
};
