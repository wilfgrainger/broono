export type AuthProvider = 'guest' | 'google' | 'apple';

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  country: string;
  provider: AuthProvider;
  totalCoins: number;
  friendCode: string;
};

export type OAuthSession = {
  token: string;
  user: UserProfile;
};

export type AuthSession = OAuthSession & {
  accessToken: string;
  expiresAt: string;
};

export type MockAuthProviderConfig = {
  clientId?: string;
  redirectUri?: string;
  scopes?: string[];
  seedUser?: Partial<UserProfile>;
};

const providerScopes: Record<Exclude<AuthProvider, 'guest'>, string[]> = {
  google: ['openid', 'email', 'profile'],
  apple: ['name', 'email'],
};

const createStarterUser = (provider: AuthProvider = 'guest'): UserProfile => ({
  id: `${provider}-demo-user`,
  email: provider === 'apple' ? 'player@privaterelay.appleid.com' : `${provider}@broono.app`,
  displayName: provider === 'guest' ? 'Guest Ranger' : provider === 'apple' ? 'Apple Ranger' : 'Google Ranger',
  country: 'US',
  provider,
  totalCoins: 940,
  friendCode: 'BRN-0420',
});

export async function signIn(provider: Exclude<AuthProvider, 'guest'>): Promise<OAuthSession> {
  const user = createStarterUser(provider);
  return {
    token: `mock-${provider}-jwt-for-cloudflare-worker`,
    user,
  };
}

export class MockOAuthProvider {
  readonly provider: Exclude<AuthProvider, 'guest'>;
  readonly clientId: string;
  readonly redirectUri: string;
  readonly scopes: string[];
  private readonly seedUser: Partial<UserProfile>;

  constructor(provider: Exclude<AuthProvider, 'guest'>, config: MockAuthProviderConfig = {}) {
    this.provider = provider;
    this.clientId = config.clientId ?? `mock-${provider}-client-id`;
    this.redirectUri = config.redirectUri ?? 'broono://auth/callback';
    this.scopes = config.scopes ?? providerScopes[provider];
    this.seedUser = config.seedUser ?? {};
  }

  async signIn(): Promise<AuthSession> {
    const baseUser = createStarterUser(this.provider);
    const user = {
      ...baseUser,
      ...this.seedUser,
      id: this.seedUser.id ?? `${this.provider}-demo-user`,
      provider: this.provider,
    };
    const token = `mock-${this.provider}-jwt-for-cloudflare-worker`;

    return {
      token,
      accessToken: token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      user,
    };
  }

  async signOut(): Promise<{ provider: Exclude<AuthProvider, 'guest'>; signedOut: true }> {
    return { provider: this.provider, signedOut: true };
  }
}

export const createGoogleAuthProvider = (config?: MockAuthProviderConfig) => new MockOAuthProvider('google', config);

export const createAppleAuthProvider = (config?: MockAuthProviderConfig) => new MockOAuthProvider('apple', config);

export const supportedAuthProviders = [
  { id: 'google', label: 'Continue with Google', appStoreRequiredPeer: 'apple' },
  { id: 'apple', label: 'Continue with Apple', appStoreRequiredPeer: 'google' },
] as const;

export const mockAuthProviders = {
  google: createGoogleAuthProvider,
  apple: createAppleAuthProvider,
};
