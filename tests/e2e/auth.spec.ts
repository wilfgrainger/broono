import { test, expect } from '@playwright/test'

const email = 'e2e-user@broono.test'

test('public legal pages render', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await page.screenshot({ path: 'test-results/privacy-page.png', fullPage: true })

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
  await page.screenshot({ path: 'test-results/terms-page.png', fullPage: true })
})

test('email login reaches the paywall and persists auth state', async ({ page, request }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'broono.' })).toBeVisible()
  await page.getByLabel('Email Address').fill(email)
  await page.getByText('I agree to the Terms of Service and Privacy Policy.').click()
  await page.getByText('I understand that my health data is stored locally on my device and I consent to this data processing to use the app (UK GDPR compliance).').click()
  await page.getByRole('button', { name: 'Continue with Email' }).click()

  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

  const magicLinkResponse = await request.get(`http://127.0.0.1:8787/_test/magic-link?email=${encodeURIComponent(email)}`)
  expect(magicLinkResponse.ok()).toBeTruthy()

  const magicLink = await magicLinkResponse.json() as { url: string }
  await page.goto(magicLink.url)

  await expect(page.getByRole('heading', { name: 'Unlock Broono Pro' })).toBeVisible()

  const persistedStore = await page.evaluate(() => {
    const raw = window.localStorage.getItem('broono-store')
    return raw ? JSON.parse(raw) : null
  })

  expect(persistedStore?.state?.userEmail).toBe(email)
  expect(persistedStore?.state?.authToken).toBeTruthy()
  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(true)
  expect(persistedStore?.state?.subscriptionStatus).toBe('free')

  await page.screenshot({ path: 'test-results/post-login-paywall.png', fullPage: true })
})
