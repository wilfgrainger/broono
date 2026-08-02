import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(path, 'utf8')

const runtimeFiles = [
  'src/App.tsx',
  'src/store.ts',
  'src/pages/Login.tsx',
  'src/pages/Profile.tsx',
  'src/pages/Journal.tsx',
  'src/pages/Dashboard.tsx',
]

const forbiddenRuntimeMarkers = [
  'VITE_API_URL',
  'api.broono.app',
  '/api/',
  'authToken',
  'subscriptionStatus',
  'GoogleAuth',
  'NativePurchases',
  'purchaseSubscription',
]

test('application runtime has no account, billing, or backend dependency', () => {
  const combined = runtimeFiles.map(read).join('\n')

  for (const marker of forbiddenRuntimeMarkers) {
    assert.equal(combined.includes(marker), false, `Unexpected cloud marker: ${marker}`)
  }
})

test('removed cloud application files do not return', () => {
  const removedPaths = [
    'backend',
    'src/pages/Waitlist.tsx',
    'src/services/billing.ts',
    'src/services/subscriptionVerification.ts',
    'src/components/Paywall.tsx',
    'src/components/PaywallModal.tsx',
    'src/types/subscription.ts',
    'tests/e2e/backend-server.ts',
    'GOOGLE_PLAY_SETUP.md',
  ]

  for (const path of removedPaths) {
    assert.equal(existsSync(path), false, `Cloud-era path must remain removed: ${path}`)
  }
})

test('production document blocks outbound application connections', () => {
  const html = read('index.html')
  const packageJson = read('package.json')

  assert.match(html, /connect-src 'none'/)
  assert.match(html, /broono-local-only-2026-08-02-v1/)
  assert.equal(packageJson.includes('test:backend'), false)
  assert.equal(packageJson.includes('pnpm --dir backend'), false)
})

test('cloud, identity and billing packages are not declared', () => {
  const packageJson = read('package.json')
  const forbiddenPackages = [
    '@capgo/native-purchases',
    '@codetrix-studio/capacitor-google-auth',
    '@cloudflare/vite-plugin',
    'wrangler',
    'vite-plugin-pwa',
  ]

  for (const packageName of forbiddenPackages) {
    assert.equal(packageJson.includes(packageName), false, `Unexpected dependency: ${packageName}`)
  }
})

test('Android build has no network, billing, auth, or purchase capability', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml')
  const build = read('android/app/capacitor.build.gradle')
  const settings = read('android/capacitor.settings.gradle')
  const nativeConfig = `${manifest}\n${build}\n${settings}`

  for (const marker of [
    'android.permission.INTERNET',
    'com.android.vending.BILLING',
    'capgo-native-purchases',
    'codetrix-studio-capacitor-google-auth',
  ]) {
    assert.equal(nativeConfig.includes(marker), false, `Unexpected Android capability: ${marker}`)
  }
})
