export type Player = {
  id: string;
  name: string;
  avatar?: string;
};

const apiBase = import.meta.env.VITE_API_URL ?? 'https://api.broono.app';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: { client_id: string; callback: (value: { credential: string }) => void }): void;
          prompt(): void;
        };
      };
    };
  }
}

export const storedPlayer = (): Player | undefined => {
  const raw = localStorage.getItem('broono.player');
  if (!raw) return undefined;
  try { return JSON.parse(raw) as Player; } catch { return undefined; }
};

export const signInWithGoogle = async (): Promise<Player> => {
  if (!googleClientId) throw new Error('Google sign-in is not configured yet');
  await loadGoogleIdentity();

  const credential = await new Promise<string>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Google sign-in timed out')), 60_000);
    window.google!.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        clearTimeout(timeout);
        resolve(credential);
      },
    });
    window.google!.accounts.id.prompt();
  });

  const response = await fetch(`${apiBase}/auth/google`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  if (!response.ok) throw new Error('Google sign-in was rejected');
  const result = await response.json() as { token: string; player: Player };
  localStorage.setItem('broono.token', result.token);
  localStorage.setItem('broono.player', JSON.stringify(result.player));
  return result.player;
};

const loadGoogleIdentity = () => new Promise<void>((resolve, reject) => {
  if (window.google) return resolve();
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Could not load Google sign-in'));
  document.head.append(script);
});
