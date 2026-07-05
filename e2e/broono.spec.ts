import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders as a mobile-first app shell inside a phone-sized viewport', async ({ page }) => {
  await expect(page.getByLabel('Broono mobile game prototype')).toBeVisible();
  await expect(page.getByText(/Android \+ iOS .*prototype/)).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThanOrEqual(430);

  const shellBox = await page.locator('.app-shell').boundingBox();
  expect(shellBox?.width).toBeLessThanOrEqual(viewport?.width ?? 430);
  expect(shellBox?.width).toBeGreaterThan(300);
});

test('supports the core care loop from daily care through puzzle rewards and shop unlock', async ({ page }) => {
  const hungerCard = page.getByRole('button', { name: /hunger/i });
  await expect(hungerCard).toContainText('80%');
  await expect(page.getByText('Level 1 · 0/100 XP toward the next surprise')).toBeVisible();

  await hungerCard.click();
  await expect(hungerCard).toContainText('96%');
  await expect(page.getByText('Level 1 · 14/100 XP toward the next surprise')).toBeVisible();

  const coinPill = page.locator('.coin-pill');
  await expect(coinPill).toContainText('940 coins');
  await expect(page.getByText('Locked until you hoard 1,000 coins or use a mock IAP top-up.')).toBeVisible();

  await page.getByRole('button', { name: /complete puzzle/i }).click();
  await expect(coinPill).toContainText('1,025 coins');
  await expect(page.getByText('Unlocked: cosmetics and utility upgrades are available.')).toBeVisible();
});

test('auth buttons swap mocked mobile sign-in identities without leaving the app', async ({ page }) => {
  await expect(page.getByText('Player: Guest Ranger')).toBeVisible();

  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByText('Player: Google Ranger')).toBeVisible();
  await expect(page.locator('.coin-pill')).toContainText('940 coins');

  await page.getByRole('button', { name: 'Continue with Apple' }).click();
  await expect(page.getByText('Player: Apple Ranger')).toBeVisible();
  await expect(page.locator('.coin-pill')).toContainText('940 coins');
});

test('shows shop gating and grants mocked payment rewards when IAP controls are exposed', async ({ page }) => {
  await expect(page.getByText('Locked until you hoard 1,000 coins or use a mock IAP top-up.')).toBeVisible();
  await expect(page.getByText('Penguin Suit')).toBeVisible();
  await expect(page.locator('.shop-row').filter({ hasText: 'Penguin Suit' })).toContainText('1200 🪙');
  await expect(page.getByText('Air Conditioning')).toBeVisible();
  await expect(page.locator('.shop-row').filter({ hasText: 'Air Conditioning' })).toContainText('1500 🪙');

  await expect(page.getByRole('heading', { name: 'Mock Store Payments' })).toBeVisible();
  await expect(page.getByText('Sandbox ready')).toBeVisible();

  await page.getByRole('button', { name: /coin pouch/i }).click();
  await expect(page.locator('.coin-pill')).toContainText('1,440 coins');
  await expect(page.getByText('Unlocked: cosmetics and utility upgrades are available.')).toBeVisible();
  await expect(page.getByText(/Mock receipt mock-app-store-coin_pouch-/)).toBeVisible();
});

test('renders global, country, and friends leaderboard rows', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Coin Leaderboards' })).toBeVisible();

  const leaderboard = page.locator('.leaderboards');
  await expect(leaderboard.getByRole('heading', { name: 'Global' })).toBeVisible();
  await expect(leaderboard.getByText('#1 Mika · JP')).toBeVisible();
  await expect(leaderboard.getByText('2420')).toBeVisible();

  await expect(leaderboard.getByRole('heading', { name: 'Country' })).toBeVisible();
  await expect(leaderboard.getByText('#2 Sol · US')).toBeVisible();
  await expect(leaderboard.getByText('1510')).toBeVisible();

  await expect(leaderboard.getByRole('heading', { name: 'Friends & Family' })).toBeVisible();
  await expect(leaderboard.getByText('#3 Kit · CA')).toBeVisible();
  await expect(leaderboard.getByText('720')).toBeVisible();
});
