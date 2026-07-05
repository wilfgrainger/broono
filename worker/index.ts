type BroonoKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

type Env = {
  BROONO_STATE?: BroonoKv;
  ENVIRONMENT?: string;
};

type JsonRecord = Record<string, unknown>;

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization',
};

const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
  ...init,
  headers: { 'content-type': 'application/json', ...corsHeaders, ...(init?.headers ?? {}) },
});

const stateKeyFor = (userId: string) => `state:${userId}`;

const userIdFrom = (state: unknown, request: Request) => {
  if (typeof state === 'object' && state && 'user' in state) {
    const user = (state as { user?: { id?: unknown } }).user;
    if (typeof user?.id === 'string' && user.id.trim()) return user.id;
  }

  const url = new URL(request.url);
  return url.searchParams.get('userId')?.trim() || 'guest';
};

const readJsonBody = async (request: Request): Promise<JsonRecord | undefined> => {
  try {
    const body = await request.json();
    return typeof body === 'object' && body !== null && !Array.isArray(body) ? body as JsonRecord : undefined;
  } catch {
    return undefined;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return json({ ok: true, service: 'broono-api', environment: env.ENVIRONMENT ?? 'production' });
    }

    if (url.pathname === '/sync' && request.method === 'POST') {
      const state = await readJsonBody(request);
      if (!state) return json({ ok: false, error: 'Expected JSON object body' }, { status: 400 });

      const userId = userIdFrom(state, request);
      await env.BROONO_STATE?.put(stateKeyFor(userId), JSON.stringify(state));
      return json({ ok: true, state, userId, syncedAt: Date.now(), persisted: Boolean(env.BROONO_STATE) });
    }

    if (url.pathname === '/sync' && request.method === 'GET') {
      const userId = url.searchParams.get('userId')?.trim() || 'guest';
      const raw = await env.BROONO_STATE?.get(stateKeyFor(userId));
      return json({ ok: true, userId, state: raw ? JSON.parse(raw) : null, persisted: Boolean(env.BROONO_STATE) });
    }

    if (url.pathname.startsWith('/leaderboard/')) {
      return json({ ok: true, scope: url.pathname.split('/').pop(), rows: [] });
    }

    return json({ ok: false, error: 'Not found' }, { status: 404 });
  },
};
