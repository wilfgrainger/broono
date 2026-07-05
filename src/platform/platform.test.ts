/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createStarterPet } from '../game';
import { createApiSync } from './apiSync';
import { signIn } from './auth';
import { createNativeBridge } from './nativeBridge';
import { createMockPaymentClient, paymentProducts } from './payment';

describe('mock platform scaffolding', () => {
  it('creates deterministic mocked OAuth sessions', async () => {
    const google = await signIn('google');
    const apple = await signIn('apple');

    expect(google.user.provider).toBe('google');
    expect(google.token).toBe('mock-google-jwt-for-cloudflare-worker');
    expect(apple.user.email).toBe('player@privaterelay.appleid.com');
  });

  it('pushes and pulls pet state through mocked Cloudflare sync', async () => {
    const sync = createApiSync({ clock: () => new Date('2026-01-01T00:00:00.000Z') });
    const payload = { pet: createStarterPet(0), coins: 125 };

    const result = await sync.push(payload);
    const pulled = await sync.pull();

    expect(result.ok).toBe(true);
    expect(result.requestId).toBe('mock-cf-mjuohs00');
    expect(pulled?.coins).toBe(125);
  });

  it('lists mobile-store comparable IAP products and creates sandbox receipts', async () => {
    const payments = createMockPaymentClient('play-store', () => new Date('2026-02-14T12:00:00.000Z'));
    const products = await payments.listProducts();
    const receipt = await payments.purchase('coin_pouch');

    expect(products).toEqual(paymentProducts);
    expect(products.map((product) => product.playBillingProductId)).toContain('care_pass_monthly');
    expect(receipt.platform).toBe('play-store');
    expect(receipt.transactionId).toBe('mock-play-store-coin_pouch-mlm9l6o0');
    expect(receipt.sandbox).toBe(true);
  });

  it('ignores corrupted stored payment receipts during restore', async () => {
    window.localStorage.setItem('broono.mock.payment.receipts.v1', '{bad json');

    const payments = createMockPaymentClient('app-store');

    await expect(payments.restorePurchases()).resolves.toEqual([]);
  });

  it('falls back to a web-compatible native bridge without Capacitor', async () => {
    const assign = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { assign } });

    const bridge = createNativeBridge();
    const device = await bridge.getDeviceInfo();
    const opened = await bridge.openUrl('https://broono.local/privacy');

    expect(bridge.platform).toBe('web');
    expect(device.model).toBe('Browser Preview');
    expect(opened.completed).toBe(true);
    expect(assign).toHaveBeenCalledWith('https://broono.local/privacy');

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });
});
