import { expect, test, type Page } from '@playwright/test'

async function startLocally(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start using Broono' }).click()
  await expect(page.getByText('Welcome to')).toBeVisible()
}

async function completeOnboarding(page: Page) {
  for (let step = 0; step < 5; step += 1) {
    if (step === 2) {
      // The starting weight is required before the flow can continue.
      await page.getByRole('button', { name: /Continue/ }).click()
      await expect(page.getByRole('alert')).toContainText('Enter your starting weight')
      await page.getByLabel('Starting Weight').fill('200')
    }
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

  // Cancelling the confirmation keeps everything.
  await page.getByRole('button', { name: 'Erase data from this device' }).click()
  const eraseDialog = page.getByRole('dialog', { name: 'Erase all Broono data?' })
  await expect(eraseDialog).toBeVisible()
  await expect(eraseDialog.getByRole('button', { name: 'Keep my data' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(eraseDialog).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  await page.getByRole('button', { name: 'Erase data from this device' }).click()
  // Erasing reloads the app, so wait for that navigation before reading storage.
  const reloaded = page.waitForEvent('load')
  await eraseDialog.getByRole('button', { name: 'Erase everything' }).click()
  await reloaded
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

test('weekly log validates, saves and feeds the dashboard and progress', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)

  await expect(page.getByText('14 st 4 lbs')).toBeVisible()

  await page.getByRole('button', { name: 'Log', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Weekly Log' })).toBeVisible()
  await expect(page).toHaveTitle(/Weekly log/)

  await page.getByRole('button', { name: /Save Log/ }).click()
  await expect(page.getByRole('alert')).toContainText('Enter your weight')
  await expect(page.getByLabel('Current Weight')).toBeFocused()

  await page.getByLabel('Current Weight').fill('195')
  await page.getByRole('button', { name: 'Left Thigh' }).click()
  await page.getByRole('button', { name: 'Nausea' }).click()
  await page.getByRole('button', { name: /Save Log/ }).click()
  await expect(page.getByRole('status')).toContainText('Log Saved')

  // Returns to the dashboard with the new weight and the amount lost, unit included.
  await expect(page.getByText('13 st 13 lbs')).toBeVisible()
  await expect(page.getByText('5 lbs down')).toBeVisible()

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('img', { name: /Weight for the last 1 log/ })).toBeVisible()
  await expect(page.getByText('Left Thigh')).toBeVisible()

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('broono-store') ?? 'null'))
  const localToday = await page.evaluate(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  expect(stored.state.logs[0].date).toBe(localToday)
})

test('daily protein and water targets can be counted up and corrected', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)

  await page.getByRole('button', { name: '+ 25g' }).click()
  await page.getByRole('button', { name: '+ 10g' }).click()
  await expect(page.getByText('35 / 100g')).toBeVisible()
  await page.getByRole('button', { name: 'Remove 10 grams of protein' }).click()
  await expect(page.getByText('25 / 100g')).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Protein' })).toHaveAttribute('value', '25')

  await page.getByRole('button', { name: '+ Add glass' }).click()
  await page.getByRole('button', { name: '+ Add glass' }).click()
  await expect(page.getByText('2 / 8 glasses')).toBeVisible()
  await page.getByRole('button', { name: 'Remove a glass of water' }).click()
  await expect(page.getByText('1 / 8 glasses')).toBeVisible()
})
