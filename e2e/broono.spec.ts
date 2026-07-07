import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto('/');
});

test('renders the mobile-first Style Showdown shell', async ({ page }) => {
  await expect(page.getByLabel('Broono Style Showdown')).toBeVisible();
  await expect(page.getByText('Style Showdown')).toBeVisible();
  await expect(page.getByLabel('Daily style challenge')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Midnight Museum|Rainbow Goalkeeper|Space Camp DJ|Forest Popstar|Retro Pet Detective/ })).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThanOrEqual(430);

  const shellBox = await page.locator('.app-shell').boundingBox();
  expect(shellBox?.width).toBeLessThanOrEqual(viewport?.width ?? 430);
  expect(shellBox?.width).toBeGreaterThan(300);
});

test('lets players style a look and create a Broono Card', async ({ page }) => {
  await expect(page.getByLabel('Styled avatar preview')).toBeVisible();
  await expect(page.getByText('Pick pieces that match the theme tags.')).toBeVisible();
  await expect(page.locator('.score-orb')).toContainText('%');

  await page.getByRole('button', { name: /Varsity Cape/ }).click();
  await page.getByRole('button', { name: /Create Broono Card/ }).click();

  await expect(page.getByRole('status')).toContainText('Broono Card');
  await expect(page.getByText('Saved locally. Share exports stay on-device until a parent enables sharing.')).toBeVisible();
  await expect(page.locator('.coin-pill')).toContainText('405');
});

test('keeps monetization out of the child-facing flow and supports Friday gifts', async ({ page }) => {
  await expect(page.getByText('No chat. No public profiles. Just safe creative cards.')).toBeVisible();
  await expect(page.getByText('Weekly free drops create habit without pressure, ads, loot boxes, or paywalls.')).toBeVisible();
  await expect(page.getByText(/Booster Bank|Snack Pouch|Most value|\\$2\\.99/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Claim gift' }).click();
  await expect(page.getByRole('button', { name: 'Gift claimed' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Lollipop Lens/ })).toBeEnabled();
});

test('supports safe voting with pre-written reactions only', async ({ page }) => {
  const voting = page.getByLabel('Safe voting');
  await expect(voting).toContainText('No comments');
  await expect(voting.getByText('Broono Card')).toHaveCount(3);

  const firstReaction = voting.getByRole('button', { name: /So clever/ }).first();
  await expect(firstReaction).toContainText('12');
  await firstReaction.click();
  await expect(firstReaction).toContainText('13');
});

test('auth buttons swap mocked identities without gating play', async ({ page }) => {
  await expect(page.getByText('Guest Stylist')).toBeVisible();
  await expect(page.getByRole('button', { name: /Create Broono Card/ })).toBeVisible();

  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect(page.getByText('Google Stylist')).toBeVisible();
  await expect(page.getByRole('button', { name: /Create Broono Card/ })).toBeVisible();

  await page.getByRole('button', { name: 'Continue with Apple' }).click();
  await expect(page.getByText('Apple Stylist')).toBeVisible();
});
