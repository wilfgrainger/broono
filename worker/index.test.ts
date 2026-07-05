import { describe, expect, it } from 'vitest';
import worker from './index';

const createKv = () => {
  const values = new Map<string, string>();
  return {
    async get(key: string) {
      return values.get(key) ?? null;
    },
    async put(key: string, value: string) {
      values.set(key, value);
    },
  };
};

describe('broono Cloudflare Worker', () => {
  it('reports health with configured environment', async () => {
    const response = await worker.fetch(new Request('https://api.broono.test/health'), { ENVIRONMENT: 'preview' });

    await expect(response.json()).resolves.toMatchObject({ ok: true, service: 'broono-api', environment: 'preview' });
  });

  it('stores and reads sync state by user id', async () => {
    const env = { BROONO_STATE: createKv(), ENVIRONMENT: 'test' };
    const payload = { user: { id: 'player-1' }, pet: { name: 'Miso' }, coins: 25 };

    const push = await worker.fetch(new Request('https://api.broono.test/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    }), env);
    const pull = await worker.fetch(new Request('https://api.broono.test/sync?userId=player-1'), env);

    await expect(push.json()).resolves.toMatchObject({ ok: true, userId: 'player-1', persisted: true });
    await expect(pull.json()).resolves.toMatchObject({ ok: true, userId: 'player-1', state: payload });
  });

  it('rejects malformed sync payloads', async () => {
    const response = await worker.fetch(new Request('https://api.broono.test/sync', {
      method: 'POST',
      body: 'not-json',
    }), {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'Expected JSON object body under 64KB' });
  });

  it('applies security headers and allows configured origins', async () => {
    const response = await worker.fetch(new Request('https://api.broono.test/health', {
      headers: { origin: 'https://broono.app' },
    }), { ENVIRONMENT: 'preview' });

    expect(response.headers.get('access-control-allow-origin')).toBe('https://broono.app');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects untrusted origins and invalid user ids', async () => {
    const blockedOrigin = await worker.fetch(new Request('https://api.broono.test/health', {
      headers: { origin: 'https://evil.example' },
    }), {});
    const invalidUser = await worker.fetch(new Request('https://api.broono.test/sync?userId=../admin'), {});

    expect(blockedOrigin.status).toBe(403);
    expect(invalidUser.status).toBe(400);
    await expect(invalidUser.json()).resolves.toMatchObject({ ok: false, error: 'Invalid user id' });
  });
});
