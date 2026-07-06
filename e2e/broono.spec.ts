import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto('/');
});

test('renders a mobile-first playable snack puzzle shell', async ({ page }) => {
  await expect(page.getByLabel('Broono Snack Pop Quest')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pop snacks. Feed Broono.' })).toBeVisible();
  await expect(page.getByText('Tap 2+ matching snacks.')).toBeVisible();
  await expect(page.getByLabel('Snack Pop board')).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThanOrEqual(430);

  const shellBox = await page.locator('.app-shell').boundingBox();
  expect(shellBox?.width).toBeLessThanOrEqual(viewport?.width ?? 430);
  expect(shellBox?.width).toBeGreaterThan(300);
});

test('supports the core tap-to-pop puzzle loop with scoring and boosters', async ({ page }) => {
  await expect(page.getByLabel('Score and moves')).toContainText('0 / 640');
  await expect(page.getByLabel('Score and moves')).toContainText('22 moves');
  await expect(page.getByText('Glowing tiles are playable groups')).toBeVisible();
  await expect(page.locator('.coin-pill')).toContainText('360');

  await page.locator('.snack-tile.playable').first().click();

  await expect(page.getByRole('status')).toContainText('snack pop');
  await expect(page.getByLabel('Score and moves')).toContainText('21 moves');
  await expect(page.locator('.coin-pill')).not.toContainText('360');

  const boosters = page.getByLabel('Boosters');
  await boosters.getByRole('button', { name: /shuffle/i }).click();
  await expect(boosters.getByRole('button', { name: /shuffle/i })).toContainText('1');
});

test('shows the five brutally ranked game ideas and chosen concept', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Five simple hit candidates' })).toBeVisible();
  await expect(page.getByText('#1 Snack Pop Quest')).toBeVisible();
  await expect(page.getByText('Chosen: lowest maintenance, strongest broad appeal, cleanest monetization.')).toBeVisible();
  await expect(page.getByText('#5 Sticker Heist')).toBeVisible();
});

test('auth buttons swap mocked mobile sign-in identities without leaving the app', async ({ page }) => {
  await expect(page.getByText('Guest Popper')).toBeVisible();

  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByText('Google Popper')).toBeVisible();
  await expect(page.locator('.coin-pill')).toContainText('360');

  await page.getByRole('button', { name: 'Continue with Apple' }).click();
  await expect(page.getByText('Apple Popper')).toBeVisible();
  await expect(page.locator('.coin-pill')).toContainText('360');
});

test('shows ethical shop gating and grants mocked payment rewards', async ({ page }) => {
  await expect(page.getByText('Opens at level 3')).toBeVisible();
  await expect(page.getByText('Gummy Cape')).toBeVisible();
  await expect(page.locator('.shop-row').filter({ hasText: 'Gummy Cape' })).toContainText('900 coins');

  await expect(page.getByRole('heading', { name: 'Booster Bank' })).toBeVisible();
  await expect(page.getByText('Grown-up approval')).toBeVisible();

  await page.getByRole('button', { name: /snack pouch/i }).click();
  await expect(page.locator('.coin-pill')).toContainText('860');
  await expect(page.getByLabel('Boosters').getByRole('button', { name: /shuffle/i })).toContainText('3');
  await expect(page.getByText(/Mock receipt mock-app-store-coin_pouch-/)).toBeVisible();
});

test('renders global, country, and friends leaderboard rows', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Pop League' })).toBeVisible();

  const leaderboard = page.locator('.leaderboard-panel');
  await expect(leaderboard.getByRole('heading', { name: 'Global' })).toBeVisible();
  await expect(leaderboard.getByText('#1 Mika - L31 - JP')).toBeVisible();
  await expect(leaderboard.getByText('18,420')).toBeVisible();

  await expect(leaderboard.getByRole('heading', { name: 'Country' })).toBeVisible();
  await expect(leaderboard.getByText('#2 Sol - L21 - US')).toBeVisible();
  await expect(leaderboard.getByText('12,110')).toBeVisible();

  await expect(leaderboard.getByRole('heading', { name: 'Friends & Family' })).toBeVisible();
  await expect(leaderboard.getByText('#3 Kit - L1 - CA')).toBeVisible();
  await expect(leaderboard.getByText('420', { exact: true })).toBeVisible();
});
