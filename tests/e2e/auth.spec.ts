import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

async function requestMagicLink(page: Page, request: APIRequestContext, email: string) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'broono.' })).toBeVisible()
  await page.getByLabel('Email Address').fill(email)
  await page.getByText('I agree to the Terms of Service and Privacy Policy.').click()
  await page.getByText('I understand that my health data is stored locally on my device and I consent to this data processing to use the app (UK GDPR compliance).').click()
  await page.getByRole('button', { name: 'Continue with Email' }).click()
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

  const magicLinkResponse = await request.get(`http://127.0.0.1:8787/_test/magic-link?email=${encodeURIComponent(email)}`)
  expect(magicLinkResponse.ok()).toBeTruthy()
  return magicLinkResponse.json() as Promise<{ url: string }>
}

async function loginToOnboarding(page: Page, request: APIRequestContext, email: string) {
  const magicLink = await requestMagicLink(page, request, email)
  await page.goto(magicLink.url)
  await expect(page.getByText('Welcome to')).toBeVisible()
}

async function completeOnboarding(page: Page) {
  for (let step = 0; step < 5; step += 1) {
    await page.getByRole('button', { name: /Continue/ }).click()
  }

  await page.getByRole('button', { name: /Get Started/ }).click()
  await expect(page.getByText('Current Weight')).toBeVisible()
}

test('public legal pages render', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await page.screenshot({ path: 'test-results/privacy-page.png', fullPage: true })

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
  await page.screenshot({ path: 'test-results/terms-page.png', fullPage: true })
})

test('valid verification lands on onboarding before the paywall', async ({ page, request }) => {
  await loginToOnboarding(page, request, 'onboarding@broono.test')

  const persistedStore = await page.evaluate(() => {
    const raw = window.localStorage.getItem('broono-store')
    return raw ? JSON.parse(raw) : null
  })

  expect(persistedStore?.state?.userEmail).toBe('onboarding@broono.test')
  expect(persistedStore?.state?.authToken).toBeTruthy()
  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(false)

  await page.screenshot({ path: 'test-results/onboarding-after-verify.png', fullPage: true })
})

test('free users complete onboarding and only see the paywall at gated features', async ({ page, request }) => {
  await loginToOnboarding(page, request, 'free-user@broono.test')
  await completeOnboarding(page)

  await expect(page.getByText('Unlock Broono Pro')).toHaveCount(0)
  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Unlock Broono Pro' })).toBeVisible()

  const persistedStore = await page.evaluate(() => {
    const raw = window.localStorage.getItem('broono-store')
    return raw ? JSON.parse(raw) : null
  })

  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(true)
  expect(persistedStore?.state?.subscriptionStatus).toBe('free')

  await page.screenshot({ path: 'test-results/progress-paywall.png', fullPage: true })
})

test('free users can access settings and sign out', async ({ page, request }) => {
  await loginToOnboarding(page, request, 'settings-user@broono.test')
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
  await loginToOnboarding(page, request, email)
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

test('invalid verification links show recovery UI', async ({ page }) => {
  await page.goto('/verify?token=expired-token&email=missing%40broono.test')
  await expect(page.getByRole('heading', { name: 'Link Expired' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Return to Login' })).toBeVisible()
})
