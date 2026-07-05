export type MobilePlatform = 'ios' | 'android' | 'web';

export type DeviceInfo = {
  platform: MobilePlatform;
  model: string;
  operatingSystem: string;
  osVersion: string;
  isVirtual: boolean;
};

export type HapticStyle = 'light' | 'medium' | 'heavy';

export type NativeBridge = {
  isNative: boolean;
  platform: MobilePlatform;
  getDeviceInfo: () => Promise<DeviceInfo>;
  hapticsImpact: (style?: HapticStyle) => Promise<void>;
  openUrl: (url: string) => Promise<{ completed: boolean; url: string }>;
  safeAreaInsets: () => Promise<{ top: number; right: number; bottom: number; left: number }>;
};

type CapacitorLike = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
};

declare global {
  interface Window {
    Capacitor?: CapacitorLike;
  }
}

const normalizePlatform = (platform?: string): MobilePlatform =>
  platform === 'ios' || platform === 'android' ? platform : 'web';

const getCapacitor = () => (typeof window === 'undefined' ? undefined : window.Capacitor);

export function createNativeBridge(): NativeBridge {
  const capacitor = getCapacitor();
  const platform = normalizePlatform(capacitor?.getPlatform?.());
  const isNative = capacitor?.isNativePlatform?.() ?? platform !== 'web';

  return {
    isNative,
    platform,
    async getDeviceInfo() {
      return {
        platform,
        model: isNative ? `Mock ${platform.toUpperCase()} Device` : 'Browser Preview',
        operatingSystem: platform === 'web' ? 'web' : platform,
        osVersion: 'mock-1.0.0',
        isVirtual: true,
      };
    },
    async hapticsImpact() {
      return undefined;
    },
    async openUrl(url: string) {
      if (typeof window !== 'undefined' && !isNative) {
        window.location.assign(url);
      }

      return { completed: true, url };
    },
    async safeAreaInsets() {
      return { top: isNative ? 24 : 0, right: 0, bottom: isNative ? 16 : 0, left: 0 };
    },
  };
}

export const nativeBridge = createNativeBridge();
