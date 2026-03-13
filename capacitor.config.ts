import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.broono.android',
  appName: 'Broono',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#F8FAFC',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'body' as const,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'LIGHT' as const,
      backgroundColor: '#005b7f',
    },
  },
}

export default config
