import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

type Env = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  SESSION_SECRET: string;
  ALLOWED_ORIGINS?: string;
  ENVIRONMENT?: string;
};

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const jsonHeaders = { 'content-type': 'application/json', 'x-content-type-options': 'nosniff' };

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, ...headers } });

const origins = (env: Env) => (env.ALLOWED_ORIGINS ?? 'https://broono.app,https://www.broono.app')
  .split(',').map((value) => value.trim()).filter(Boolean);

const cors = (request: Request, env: Env): Record<string, string> => {
  const origin = request.headers.get('origin');
  return origin && origins(env).includes(origin)
    ? { 'access-control-allow-origin': origin, vary: 'Origin' }
    : {};
};

const readBody = async (request: Request) => {
  if (Number(request.headers.get('content-length') ?? 0) > 128_000) return undefined;
  try { return await request.json() as Record<string, unknown>; } catch { return undefined; }
};

const signingKey = (env: Env) => new TextEncoder().encode(env.SESSION_SECRET);

const playerId = async (request: Request, env: Env) => {
  const value = request.headers.get('authorization');
  if (!value?.startsWith('Bearer ')) return undefined;
  try {
    const { payload } = await jwtVerify(value.slice(7), signingKey(env), { issuer: 'broono.app', audience: 'broono-game' });
    return payload.sub;
  } catch {
    return undefined;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const responseCors = cors(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...responseCors,
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'authorization,content-type',
          'access-control-max-age': '86400',
        },
      });
    }

    if (request.headers.has('origin') && !Object.keys(responseCors).length) {
      return json({ ok: false, error: 'Origin not allowed' }, 403);
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ ok: true, service: 'broono-api', environment: env.ENVIRONMENT ?? 'production' }, 200, responseCors);
    }

    if (url.pathname === '/auth/google' && request.method === 'POST') {
      const body = await readBody(request);
      const credential = body?.credential;
      if (typeof credential !== 'string') return json({ ok: false, error: 'Credential required' }, 400, responseCors);

      try {
        const { payload } = await jwtVerify(credential, googleKeys, {
          audience: env.GOOGLE_CLIENT_ID,
          issuer: ['https://accounts.google.com', 'accounts.google.com'],
        });
        if (!payload.sub || !payload.email) return json({ ok: false, error: 'Incomplete Google identity' }, 401, responseCors);

        const name = typeof payload.name === 'string' ? payload.name.slice(0, 80) : 'Player';
        const avatar = typeof payload.picture === 'string' ? payload.picture : null;
        await env.DB.prepare(
          `INSERT INTO players (id, email, display_name, avatar_url, updated_at)
           VALUES (?, ?, ?, ?, unixepoch())
           ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name,
             avatar_url = excluded.avatar_url, updated_at = excluded.updated_at`,
        ).bind(payload.sub, payload.email, name, avatar).run();

        const token = await new SignJWT({ name })
          .setProtectedHeader({ alg: 'HS256' })
          .setSubject(payload.sub)
          .setIssuer('broono.app')
          .setAudience('broono-game')
          .setIssuedAt()
          .setExpirationTime('30d')
          .sign(signingKey(env));

        return json({ ok: true, token, player: { id: payload.sub, name, avatar } }, 200, responseCors);
      } catch {
        return json({ ok: false, error: 'Google credential rejected' }, 401, responseCors);
      }
    }

    if (url.pathname === '/save' && request.method === 'POST') {
      const id = await playerId(request, env);
      if (!id) return json({ ok: false, error: 'Authentication required' }, 401, responseCors);
      const body = await readBody(request);
      if (!body) return json({ ok: false, error: 'Valid save required' }, 400, responseCors);
      const night = Math.max(1, Math.min(99, Number(body.night ?? 1)));
      await env.DB.prepare(
        `INSERT INTO saves (player_id, state_json, highest_night, updated_at)
         VALUES (?, ?, ?, unixepoch())
         ON CONFLICT(player_id) DO UPDATE SET state_json = excluded.state_json,
           highest_night = max(saves.highest_night, excluded.highest_night), updated_at = excluded.updated_at`,
      ).bind(id, JSON.stringify(body), night).run();
      return json({ ok: true }, 200, responseCors);
    }

    if (url.pathname === '/save' && request.method === 'GET') {
      const id = await playerId(request, env);
      if (!id) return json({ ok: false, error: 'Authentication required' }, 401, responseCors);
      const row = await env.DB.prepare('SELECT state_json, updated_at FROM saves WHERE player_id = ?').bind(id).first();
      return json({ ok: true, save: row ? JSON.parse(String(row.state_json)) : null, updatedAt: row?.updated_at ?? null }, 200, responseCors);
    }

    if (url.pathname === '/leaderboard' && request.method === 'GET') {
      const rows = await env.DB.prepare(
        `SELECT p.display_name AS name, p.avatar_url AS avatar, s.highest_night AS night
         FROM saves s JOIN players p ON p.id = s.player_id
         ORDER BY s.highest_night DESC, s.updated_at ASC LIMIT 50`,
      ).all();
      return json({ ok: true, rows: rows.results }, 200, responseCors);
    }

    return json({ ok: false, error: 'Not found' }, 404, responseCors);
  },
};
