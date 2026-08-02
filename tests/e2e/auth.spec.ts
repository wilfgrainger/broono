import { expect, test, type Page } from '@playwright/test'

async function startLocally(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start using Broono' }).click()
  await expect(page.getByText('Welcome to')).toBeVisible()
}

async function completeOnboarding(page: Page) {
  for (let step = 0; step < 5; step += 1) {
    await page.getByRole('button', { name: /Continue/ }).click()
  }

  await page.getByRole('button', { name: /Get Started/ }).click()
  await expect(page.getByText('Current Weight')).toBeVisible()
}

test('local-only landing and legal pages render', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Local-only on your phone')).toBeVisible()
  await expect(page.getByText('No sign-in. No tracking account.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start using Broono' })).toBeVisible()

  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await expect(page.getByText('No Broono account or server record')).toBeVisible()

  await page.goto('/terms')
  await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible()
  await expect(page.getByText('Local software')).toBeVisible()
})

test('local users complete onboarding and can use every feature', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()
  await expect(page.getByText('Unlock Broono Pro')).toHaveCount(0)

  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  for (let entry = 1; entry <= 4; entry += 1) {
    await page.getByPlaceholder(/Noticed your clothes/).fill(`Local journal entry ${entry}`)
    await page.getByRole('button', { name: 'Save journal entry' }).click()
  }
  await expect(page.getByText('Local journal entry 4')).toBeVisible()

  const persistedStore = await page.evaluate(() => {
    const raw = window.localStorage.getItem('broono-store')
    return raw ? JSON.parse(raw) : null
  })

  expect(persistedStore?.state?.hasStarted).toBe(true)
  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(true)
  expect(persistedStore?.state?.journalEntries).toHaveLength(4)
  expect(persistedStore?.state?.authToken).toBeUndefined()
  expect(persistedStore?.state?.subscriptionStatus).toBeUndefined()
})

test('settings export and erase only local data', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)

  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByText('Local data only')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export my local data' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^broono-export-\d{4}-\d{2}-\d{2}\.json$/)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Erase data from this device' }).click()
  await expect(page.getByText('Local-only on your phone')).toBeVisible()

  const persistedStore = await page.evaluate(() => {
    const raw = window.localStorage.getItem('broono-store')
    return raw ? JSON.parse(raw) : null
  })

  expect(persistedStore?.state?.hasStarted).toBe(false)
  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(false)
  expect(persistedStore?.state?.logs).toEqual([])
  expect(persistedStore?.state?.journalEntries).toEqual([])
})
