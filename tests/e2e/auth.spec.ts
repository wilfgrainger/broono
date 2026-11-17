import { expect, test, type Page } from '@playwright/test'

// The suite runs with an en-GB locale, so new profiles default to stones and pounds.

/** Fails the test on console errors, which is how a Content-Security-Policy violation shows up. */
function failOnConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors).toEqual([])
}

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
      const start = page.getByRole('group', { name: 'Starting Weight' })
      await start.getByRole('spinbutton', { name: 'Stones' }).fill('14')
      await start.getByRole('spinbutton', { name: 'Pounds' }).fill('4')
    }
    await page.getByRole('button', { name: /Continue/ }).click()
  }

  await expect(page.getByText('14 st 4 lbs')).toBeVisible()
  await page.getByRole('button', { name: /Get Started/ }).click()
  await expect(page.getByText('Current Weight')).toBeVisible()
}

const readStore = (page: Page) =>
  page.evaluate(() => JSON.parse(window.localStorage.getItem('broono-store') ?? 'null'))

async function saveLog(page: Page, stones: string, pounds: string) {
  await page.getByRole('button', { name: 'Log', exact: true }).click()
  // Make the entry a weigh-in only, whatever weekday the test runs on.
  await page.getByRole('radio', { name: 'No injection this time' }).check()
  await page.getByRole('spinbutton', { name: 'Stones' }).fill(stones)
  await page.getByRole('spinbutton', { name: 'Pounds' }).fill(pounds)
  await page.getByRole('button', { name: /Save Log/ }).click()
  await expect(page.locator('.toast')).toContainText('Log saved')
  await expect(page.getByText('Current Weight')).toBeVisible()
}

test('local-only landing and legal pages render', async ({ page }) => {
  const expectNoConsoleErrors = failOnConsoleErrors(page)

  await page.goto('/')
  await expect(page.getByText('Local-only on your phone')).toBeVisible()
  await expect(page.getByText('No sign-in. No tracking account.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start using Broono' })).toBeVisible()

  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
  await expect(page.getByText('No Broono account or server record')).toBeVisible()

  // GitHub Pages serves the legal pages with a trailing slash.
  await page.goto('/terms/')
  await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible()
  await expect(page.getByText('Local software')).toBeVisible()

  expectNoConsoleErrors()
})

test('local users complete onboarding and can use every feature', async ({ page }) => {
  const expectNoConsoleErrors = failOnConsoleErrors(page)
  await startLocally(page)
  await completeOnboarding(page)

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeFocused()
  await expect(page.getByText('Unlock Broono Pro')).toHaveCount(0)

  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  for (let entry = 1; entry <= 4; entry += 1) {
    await page.getByPlaceholder(/Noticed your clothes/).fill(`Local journal entry ${entry}`)
    await page.getByRole('button', { name: 'Save journal entry' }).click()
  }
  await expect(page.getByText('Local journal entry 4')).toBeVisible()

  // Deleting asks first, and cancelling keeps the entry.
  await page.getByRole('button', { name: /Delete entry/ }).first().click()
  const deleteDialog = page.getByRole('dialog', { name: 'Delete this entry?' })
  await deleteDialog.getByRole('button', { name: 'Keep it' }).click()
  await expect(page.getByText('Local journal entry 4')).toBeVisible()
  await page.getByRole('button', { name: /Delete entry/ }).first().click()
  await deleteDialog.getByRole('button', { name: 'Delete entry' }).click()
  await expect(page.getByText('Local journal entry 4')).toHaveCount(0)

  const persistedStore = await readStore(page)
  expect(persistedStore?.state?.hasStarted).toBe(true)
  expect(persistedStore?.state?.hasCompletedOnboarding).toBe(true)
  expect(persistedStore?.state?.journalEntries).toHaveLength(3)
  expect(persistedStore?.state?.authToken).toBeUndefined()
  expect(persistedStore?.state?.subscriptionStatus).toBeUndefined()
  // Only data is persisted, never the store's functions or transient UI state.
  expect(Object.keys(persistedStore.state).sort()).toEqual([
    'dailyProtein', 'dailyWater', 'hasCompletedOnboarding', 'hasStarted', 'journalEntries', 'logs', 'profile',
  ])
  expectNoConsoleErrors()
})

test('settings export, import and erase only local data', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)
  await saveLog(page, '13', '13')

  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByText('Your data', { exact: true })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export my local data' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^broono-export-\d{4}-\d{2}-\d{2}\.json$/)
  const backupPath = await download.path()

  // A file that is not a backup is rejected without touching anything.
  await page.locator('#import-file-input').setInputFiles({
    name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":"world"}'),
  })
  await expect(page.getByText('That file is not a Broono backup')).toBeVisible()

  // Cancelling the erase confirmation keeps everything.
  await page.getByRole('button', { name: 'Erase data from this device' }).click()
  const eraseDialog = page.getByRole('dialog', { name: 'Erase all Broono data?' })
  await expect(eraseDialog).toBeVisible()
  await expect(eraseDialog.getByRole('button', { name: 'Keep my data' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(eraseDialog).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  // Erasing reloads the app, so wait for that navigation before reading storage.
  await page.getByRole('button', { name: 'Erase data from this device' }).click()
  const reloaded = page.waitForEvent('load')
  await eraseDialog.getByRole('button', { name: 'Erase everything' }).click()
  await reloaded
  await expect(page.getByText('Local-only on your phone')).toBeVisible()

  const erased = await readStore(page)
  expect(erased?.state?.hasStarted).toBe(false)
  expect(erased?.state?.hasCompletedOnboarding).toBe(false)
  expect(erased?.state?.logs).toEqual([])
  expect(erased?.state?.journalEntries).toEqual([])

  // The exported file restores the erased data on a fresh profile.
  await page.getByRole('button', { name: 'Start using Broono' }).click()
  await completeOnboarding(page)
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.locator('#import-file-input').setInputFiles(backupPath)
  const importDialog = page.getByRole('dialog', { name: 'Replace your data with this backup?' })
  await expect(importDialog).toContainText('The backup has 1 log')
  await importDialog.getByRole('button', { name: 'Replace my data' }).click()
  await expect(page.getByText('Backup imported.')).toBeVisible()

  const restored = await readStore(page)
  expect(restored.state.logs).toHaveLength(1)
  expect(restored.state.logs[0].weight).toBe(195)
  expect(restored.state.profile.weightUnit).toBe('st')
})

test('weekly log validates, saves and feeds the dashboard and progress', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)

  await expect(page.getByText('14 st 4 lbs')).toBeVisible()

  await page.getByRole('button', { name: 'Log', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Add a log' })).toBeVisible()
  await expect(page).toHaveTitle(/Add a log/)

  // Neither a weight nor an injection: nothing to save.
  await page.getByRole('radio', { name: 'No injection this time' }).check()
  await page.getByRole('button', { name: /Save Log/ }).click()
  await expect(page.getByRole('alert')).toContainText('an injection, or both')
  await expect(page.getByRole('spinbutton', { name: 'Stones' })).toBeFocused()

  await page.getByRole('spinbutton', { name: 'Stones' }).fill('13')
  await page.getByRole('spinbutton', { name: 'Pounds' }).fill('13')
  await page.getByRole('radio', { name: /^Left Thigh/ }).check()
  await page.getByRole('button', { name: '7.5 milligrams' }).click()
  // Side effects are multi-select, and choosing one clears "None".
  await page.getByRole('checkbox', { name: 'Nausea' }).check()
  await page.getByRole('checkbox', { name: 'Fatigue' }).check()
  await expect(page.getByRole('checkbox', { name: 'None' })).not.toBeChecked()
  await page.getByRole('button', { name: /Save Log/ }).click()
  await expect(page.locator('.toast')).toContainText('Log saved')

  // Returns to the dashboard with the new weight and the amount lost, unit included.
  await expect(page.getByText('13 st 13 lbs')).toBeVisible()
  await expect(page.getByText(/5 lbs down/)).toBeVisible()

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('img', { name: /One weigh-in: 13 st 13 lbs/ })).toBeVisible()
  await expect(page.getByText('Left Thigh · 7.5 mg')).toBeVisible()
  await expect(page.locator('.chip-danger', { hasText: 'Fatigue' })).toBeVisible()

  const stored = await readStore(page)
  const localToday = await page.evaluate(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  expect(stored.state.logs[0].date).toBe(localToday)
  expect(stored.state.logs[0].weight).toBe(195)
  expect(stored.state.logs[0].symptoms).toEqual(['Nausea', 'Fatigue'])
  expect(stored.state.logs[0].doseMg).toBe(7.5)
  // Logging a new dose updates the current dose (titration).
  expect(stored.state.profile.doseMg).toBe(7.5)

  // A mistaken log can be removed, after confirmation.
  await page.getByRole('button', { name: /Delete log/ }).click()
  await page.getByRole('dialog', { name: 'Delete this log?' }).getByRole('button', { name: 'Delete log' }).click()
  await expect(page.getByText('No logs yet')).toBeVisible()
})

test('changing the weight unit converts saved weights instead of relabelling them', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)
  await saveLog(page, '13', '13')

  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('radio', { name: 'Kilograms' }).check()
  let stored = await readStore(page)
  expect(stored.state.profile.startWeight).toBe(90.7)
  expect(stored.state.logs[0].weight).toBe(88.5)

  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByText('88.5 kg')).toBeVisible()

  // Plain pounds are shown as pounds, not forced into stones.
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('radio', { name: /^Pounds$/ }).check()
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.getByText('195.1 lbs')).toBeVisible()

  stored = await readStore(page)
  expect(stored.state.profile.weightUnit).toBe('lbs')
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

test('data saved by the previous store version is migrated, not lost', async ({ page }) => {
  await page.goto('/')
  // Version 3: no daily protein, `lbs` meant "show stones", onboarding flag present.
  await page.evaluate(() => {
    window.localStorage.setItem('broono-store', JSON.stringify({
      version: 3,
      state: {
        hasStarted: true,
        hasCompletedOnboarding: true,
        profile: { medicationName: 'Wegovy', dose: '1mg', injectionDayOfWeek: 4, startWeight: 200, weightUnit: 'lbs', proteinGoalG: 90, waterGoalGlasses: 6 },
        logs: [{ id: 'a', date: '2026-01-05', displayDate: 'Jan 5', weight: 196, site: 'Left Thigh', symptoms: ['Nausea'], notes: 'ok' }],
        journalEntries: [{ id: 'j', date: '2026-01-05', displayDate: 'Jan 5', text: 'Kept' }],
        dailyWater: { date: '2026-01-05', glasses: 3 },
      },
    }))
  })
  await page.reload()

  await expect(page.getByText('Current Weight')).toBeVisible()
  await expect(page.getByText('14 st', { exact: true })).toBeVisible()
  await expect(page.getByText(/4 lbs down/)).toBeVisible()

  const stored = await readStore(page)
  expect(stored.version).toBe(6)
  expect(stored.state.profile.doseMg).toBe(1)
  expect(stored.state.logs[0].doseMg).toBe(0)
  expect(stored.state.profile.weightUnit).toBe('st')
  expect(stored.state.profile.medicationName).toBe('Wegovy')
  expect(stored.state.journalEntries[0].text).toBe('Kept')
  expect(stored.state.dailyProtein.grams).toBe(0)
})

test('tabs are in browser history, so Back returns to the previous tab', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page).toHaveURL(/#progress$/)
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page).toHaveURL(/#journal$/)

  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()
  await page.goBack()
  await expect(page.getByText('Current Weight')).toBeVisible()

  // A reload keeps the current tab.
  await page.goForward()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()

  // Saving a log replaces the form's history entry, so Back skips the finished form.
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await saveLog(page, '14', '0')
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Add a log' })).toHaveCount(0)
})

test('a failed save to device storage is reported instead of ignored', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)

  // Simulate a full or blocked storage area.
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    }
  })
  await page.getByRole('button', { name: '+ Add glass' }).click()
  await expect(page.getByRole('alert')).toContainText('Changes could not be saved on this device')
  // The in-memory change still shows, so nothing typed is lost before exporting.
  await expect(page.getByText('1 / 8 glasses')).toBeVisible()
})

test('the site is installable: manifest and icons are served', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  const manifest = await (await request.get(href!)).json()
  expect(manifest.id).toBe('/')
  expect(manifest.display).toBe('standalone')
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src)
    expect(response.ok(), icon.src).toBe(true)
    expect(response.headers()['content-type']).toContain('image/png')
  }
  expect((await request.get('/og-image.png')).ok()).toBe(true)
})

test('logging injections builds the level estimate, rotates sites and tracks the next dose', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)
  await expect(page.getByText(/Add your dose in Settings/)).toBeVisible()

  await page.getByRole('button', { name: 'Log', exact: true }).click()
  await page.getByRole('radio', { name: /^Left Stomach/ }).check()
  await page.getByRole('button', { name: '2.5 milligrams', exact: true }).click()
  // An injection can be logged without a weigh-in.
  await page.getByRole('button', { name: /Save Log/ }).click()
  await expect(page.locator('.toast')).toContainText('Log saved')

  await expect(page.getByText('Est. level')).toBeVisible()
  await expect(page.getByRole('img', { name: /Estimated level over the last 4 weeks/ })).toBeVisible()
  await expect(page.getByText('Suggested site:')).toContainText('Right Stomach')
  await expect(page.getByText('Zepbound · 2.5 mg').or(page.getByText(/^Next: /))).toBeVisible()

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Dose History' })).toBeVisible()
  await expect(page.getByText('Injection', { exact: true })).toBeVisible()
})

test('appearance can follow the system or be pinned, and the choice survives a reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await startLocally(page)
  await completeOnboarding(page)
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const light = await background()

  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByRole('radio', { name: 'Dark' }).check()
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark')
  expect(await background()).not.toBe(light)

  await page.reload()
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark')

  await page.getByRole('radio', { name: 'System' }).check()
  expect(await background()).toBe(light)
  expect(await page.evaluate(() => localStorage.getItem('color-scheme'))).toBeNull()

  // With no override, the system preference applies.
  await page.emulateMedia({ colorScheme: 'dark' })
  expect(await background()).not.toBe(light)
})

test('calendar reminder and spreadsheet exports contain the right data', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)
  await saveLog(page, '14', '0')
  await page.getByRole('button', { name: 'Open settings' }).click()

  const reminder = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Add a weekly reminder to my calendar' }).click()
  const ics = await (await reminder).createReadStream().then(async (stream) => {
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    return Buffer.concat(chunks).toString('utf8')
  })
  expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
  expect(ics).toContain('T090000')

  const csvDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: /Export logs as a spreadsheet/ }).click()
  const csv = await (await csvDownload).createReadStream().then(async (stream) => {
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    return Buffer.concat(chunks).toString('utf8')
  })
  expect(csv.split('\r\n')[0]).toBe('Date,Weight (lbs),Injection site,Dose (mg),Side effects,Notes')
  expect(csv).toContain(',196,,,None,')
})

test('the guide gives the missed-dose window for the chosen medicine', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)
  await page.getByRole('button', { name: 'Guide', exact: true }).click()
  await expect(page.getByText(/4 days \(96 hours\) or less/)).toBeVisible()

  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByLabel('Medication').selectOption('Wegovy')
  await page.getByRole('button', { name: 'Guide', exact: true }).click()
  await expect(page.getByText(/5 days \(120 hours\) or less/)).toBeVisible()
  await expect(page.getByRole('heading', { name: /Get medical help straight away/ })).toBeVisible()
})

test('a saved log can be edited from Progress', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)
  await saveLog(page, '14', '0')

  await page.getByRole('button', { name: 'Progress', exact: true }).click()
  await page.getByRole('button', { name: /^Edit log from/ }).click()
  await expect(page.getByRole('heading', { name: 'Edit log' })).toBeVisible()
  // The form opens with the saved values.
  await expect(page.getByRole('spinbutton', { name: 'Stones' })).toHaveValue('14')
  await expect(page.getByRole('radio', { name: 'No injection this time' })).toBeChecked()

  await page.getByRole('spinbutton', { name: 'Pounds' }).fill('2')
  await page.getByRole('checkbox', { name: 'Headache' }).check()
  await page.getByLabel('Notes (optional)').fill('Corrected weight')
  await page.getByRole('button', { name: /Save changes/ }).click()
  await expect(page.locator('.toast').last()).toContainText('Changes saved')

  // Returns to Progress with the change applied, and no duplicate log.
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()
  await expect(page.locator('.history-item')).toHaveCount(1)
  await expect(page.getByText('Corrected weight')).toBeVisible()
  const stored = await readStore(page)
  expect(stored.state.logs).toHaveLength(1)
  expect(stored.state.logs[0].weight).toBe(198)
  expect(stored.state.logs[0].symptoms).toEqual(['Headache'])

  // The device reminder toggle only appears in the Android app.
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByText('Remind me on this phone')).toHaveCount(0)
})

test('saving shows a dismissable toast in the notifications region, without blocking', async ({ page }) => {
  await startLocally(page)
  await completeOnboarding(page)
  await saveLog(page, '14', '0')

  const region = page.getByRole('region', { name: 'Notifications' })
  await expect(region.locator('.toast')).toContainText('Log saved')
  // Already back on Home: the toast does not hold the user up.
  await expect(page.getByText('Current weight')).toBeVisible()
  await region.getByRole('button', { name: 'Dismiss' }).click()
  await expect(region.locator('.toast')).toHaveCount(0)
})

test('wide screens get a sidebar instead of a bottom tab bar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await startLocally(page)
  await completeOnboarding(page)
  const nav = page.getByRole('navigation', { name: 'Primary navigation' })
  const box = (await nav.boundingBox())!
  expect(box.x).toBe(0)
  expect(box.height).toBeGreaterThan(500)
  expect(box.width).toBeLessThan(300)
  await nav.getByRole('button', { name: 'Progress' }).click()
  await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible()
})
