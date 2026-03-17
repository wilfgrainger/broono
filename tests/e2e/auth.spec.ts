import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

type AuthResponse = {
  success: boolean
  token: string
  user: {
    email: string
    subscription_status: 'free' | 'pro' | 'canceled'
  }
}

async function authenticateWithGoogleSession(page: Page, request: APIRequestContext, email: string) {
  const authResponse = await request.post('http://127.0.0.1:8787/_test/google-auth', {
    data: { email },
  })
  expect(authResponse.ok()).toBeTruthy()

  const auth = await authResponse.json() as AuthResponse
  const today = new Date().toISOString().split('T')[0]

  await page.goto('/privacy')
  await page.evaluate(({ token, email: userEmail, status, todayDate }) => {
    window.localStorage.setItem('broono-store', JSON.stringify({
      state: {
        hasCompletedOnboarding: false,
        profile: {
          medicationName: 'Zepbound',
          dose: '5mg',
          injectionDayOfWeek: 1,
          startWeight: 0,
          weightUnit: 'lbs',
          proteinGoalG: 100,
          waterGoalGlasses: 8,
        },
        logs: [],
        journalEntries: [],
        dailyWater: { date: todayDate, glasses: 0 },
        authToken: token,
        userEmail,
        subscriptionStatus: status,
      },
      version: 2,
    }))
  }, {
    token: auth.token,
    email: auth.user.email,
    status: auth.user.subscription_status,
    todayDate: today,
  })

  await page.goto('/')
  await expect(page.getByText('Welcome to')).toBeVisible()
}

async function completeOnboarding(page: Page) {
  for (let step = 0; step < 5; step += 1) {
    await page.getByRole('button', { name: /Continue/ }).click()
  }

  await page.getByRole('button', { name: /Get Started/ }).click()
  await expect(page.getByText('Current Weight')).toBeVisible()
}

test('public legal pages and login messaging render', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'broono.' })).toBeVisible()
  await expect(page.getByText('Google sign-in only')).toBeVisible()
  await expect(page.getByText('Sign-in is available in the Android app build only.')).toBeVisible()

  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await page.screenshot({ path: 'test-results/privacy-page.png', fullPage: true })

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
  await page.screenshot({ path: 'test-results/terms-page.png', fullPage: true })
})

test('google-authenticated users land on onboarding before the paywall', async ({ page, request }) => {
  await authenticateWithGoogleSession(page, request, 'broono-test-login@gmail.com')

  const persistedStore = await page.evaluate(() => {
    const raw = window.localStorage.getItem('broono-store')
    return raw ? JSON.parse(raw) : null
  })

  expect(persistedStore?.state?.userEmail).toBe('broono-test-login@gmail.com')
  expect(persistedStore?.state?.authToken).toBeTruthy()
  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(false)

  await page.screenshot({ path: 'test-results/onboarding-after-google-login.png', fullPage: true })
})

test('free users complete onboarding and only see the paywall at gated features', async ({ page, request }) => {
  await authenticateWithGoogleSession(page, request, 'free-user@broono.test')
  await completeOnboarding(page)

  await expect(page.getByText('Unlock Broono Pro')).toHaveCount(0)
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Unlock Broono Pro' })).toBeVisible()
  await expect(page.getByText('Google Play billing only')).toBeVisible()
  await expect(page.getByText('Start your 2-day free trial in the Android app through Google Play')).toBeVisible()

  const persistedStore = await page.evaluate(() => {
    const raw = window.localStorage.getItem('broono-store')
    return raw ? JSON.parse(raw) : null
  })

  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(true)
  expect(persistedStore?.state?.subscriptionStatus).toBe('free')

  await page.screenshot({ path: 'test-results/progress-paywall.png', fullPage: true })
})

test('free users can access settings and sign out', async ({ page, request }) => {
  await authenticateWithGoogleSession(page, request, 'settings-user@broono.test')
  await completeOnboarding(page)

  await page.getByRole('button', { name: 'Open profile' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Delete Account' })).toBeVisible()
  await page.screenshot({ path: 'test-results/free-settings.png', fullPage: true })

  await page.getByRole('button', { name: 'Sign Out' }).click()
  await expect(page.getByRole('heading', { name: 'broono.' })).toBeVisible()
})

test('delete account resets local state and removes the backend user', async ({ page, request }) => {
  const email = 'delete-user@broono.test'
  await authenticateWithGoogleSession(page, request, email)
  await completeOnboarding(page)

  await page.getByRole('button', { name: 'Open profile' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete Account' }).click()
  await expect(page.getByRole('heading', { name: 'broono.', exact: true })).toBeVisible({ timeout: 10000 })

  const persistedStore = await page.evaluate(() => {
    const raw = window.localStorage.getItem('broono-store')
    return raw ? JSON.parse(raw) : null
  })

  expect(persistedStore?.state?.authToken).toBe(null)
  expect(persistedStore?.state?.userEmail).toBe(null)
  expect(persistedStore?.state?.logs).toEqual([])
  expect(persistedStore?.state?.journalEntries).toEqual([])
  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(false)

  const userResponse = await request.get(`http://127.0.0.1:8787/_test/user?email=${encodeURIComponent(email)}`)
  expect(userResponse.status()).toBe(404)

  await page.screenshot({ path: 'test-results/delete-account-login.png', fullPage: true })
})
