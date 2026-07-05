type Env = { ASSETS: Fetcher; BROONO_STATE?: KVNamespace };

const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
  ...init,
  headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', ...(init?.headers ?? {}) },
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return json({ ok: true });
    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ ok: true, service: 'broono-api' });
    if (url.pathname === '/sync' && request.method === 'POST') {
      const state = await request.json();
      const userId = typeof state === 'object' && state && 'user' in state ? (state as { user?: { id?: string } }).user?.id : 'guest';
      await env.BROONO_STATE?.put(`state:${userId ?? 'guest'}`, JSON.stringify(state));
      return json({ ok: true, state, syncedAt: Date.now() });
    }
    if (url.pathname.startsWith('/leaderboard/')) {
      return json({ ok: true, scope: url.pathname.split('/').pop(), rows: [] });
    }
    return env.ASSETS.fetch(request);
  },
};
