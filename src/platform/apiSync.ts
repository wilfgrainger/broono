import type { Pet } from '../game';
import type { AuthSession } from './auth';

export type SyncEnvironment = 'local' | 'cloudflare-preview';

export type SyncPayload = {
  pet: Pet;
  coins: number;
  updatedAt: string;
};

export type SyncResult = {
  ok: true;
  environment: SyncEnvironment;
  requestId: string;
  persistedAt: string;
  payload: SyncPayload;
};

export type ApiSyncConfig = {
  baseUrl?: string;
  environment?: SyncEnvironment;
  authSession?: AuthSession;
  clock?: () => Date;
};

const storageKey = 'broono.mock.cloudflare.sync';

const hasLocalStorage = () => typeof globalThis.localStorage !== 'undefined';

const requestId = (date: Date) => `mock-cf-${date.getTime().toString(36)}`;

export class MockCloudflareApiSync {
  readonly baseUrl: string;
  readonly environment: SyncEnvironment;
  private readonly authSession?: AuthSession;
  private readonly clock: () => Date;
  private memoryPayload?: SyncPayload;

  constructor(config: ApiSyncConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'https://broono-mobile-preview.workers.dev';
    this.environment = config.environment ?? 'local';
    this.authSession = config.authSession;
    this.clock = config.clock ?? (() => new Date());
  }

  async push(payload: Omit<SyncPayload, 'updatedAt'> & { updatedAt?: string }): Promise<SyncResult> {
    const now = this.clock();
    const nextPayload: SyncPayload = {
      ...payload,
      updatedAt: payload.updatedAt ?? now.toISOString(),
    };
    this.persist(nextPayload);

    return {
      ok: true,
      environment: this.environment,
      requestId: requestId(now),
      persistedAt: now.toISOString(),
      payload: nextPayload,
    };
  }

  async pull(): Promise<SyncPayload | undefined> {
    if (hasLocalStorage()) {
      const raw = globalThis.localStorage.getItem(this.storageKey());
      return raw ? (JSON.parse(raw) as SyncPayload) : undefined;
    }

    return this.memoryPayload;
  }

  async healthCheck() {
    return {
      ok: true,
      baseUrl: this.baseUrl,
      environment: this.environment,
      authenticated: Boolean(this.authSession),
      mode: 'mock-cloudflare-worker',
    } as const;
  }

  private persist(payload: SyncPayload) {
    if (hasLocalStorage()) {
      globalThis.localStorage.setItem(this.storageKey(), JSON.stringify(payload));
      return;
    }

    this.memoryPayload = payload;
  }

  private storageKey() {
    return this.authSession ? `${storageKey}.${this.authSession.user.id}` : storageKey;
  }
}

export const createApiSync = (config?: ApiSyncConfig) => new MockCloudflareApiSync(config);
