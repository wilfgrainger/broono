export type StorePlatform = 'app-store' | 'play-store';
export type PaymentProductType = 'consumable' | 'non-consumable' | 'subscription';
export type PaymentProductId = 'coin_pouch' | 'coin_vault' | 'starter_bundle' | 'care_pass_monthly';

export type PaymentProduct = {
  id: PaymentProductId;
  type: PaymentProductType;
  displayName: string;
  description: string;
  localizedPrice: string;
  priceMicros: number;
  currencyCode: 'USD';
  storeKitProductId: string;
  playBillingProductId: string;
  coinAmount: number;
  bonusItemIds: string[];
  badge: string;
};

export type PurchaseReceipt = {
  id: string;
  productId: PaymentProductId;
  platform: StorePlatform;
  transactionId: string;
  purchaseToken: string;
  purchasedAt: string;
  sandbox: true;
};

export type PaymentClient = {
  platform: StorePlatform;
  listProducts: () => Promise<PaymentProduct[]>;
  purchase: (productId: PaymentProductId) => Promise<PurchaseReceipt>;
  restorePurchases: () => Promise<PurchaseReceipt[]>;
};

export const paymentProducts: PaymentProduct[] = [
  {
    id: 'coin_pouch',
    type: 'consumable',
    displayName: 'Snack Pouch',
    description: 'Coins plus one shuffle booster for a stuck board.',
    localizedPrice: '$0.99',
    priceMicros: 990_000,
    currencyCode: 'USD',
    storeKitProductId: 'app.broono.coins.pouch',
    playBillingProductId: 'coins_pouch',
    coinAmount: 500,
    bonusItemIds: [],
    badge: 'Best first buy',
  },
  {
    id: 'coin_vault',
    type: 'consumable',
    displayName: 'Booster Vault',
    description: 'Big coin pack with shuffle and spoon boosters.',
    localizedPrice: '$4.99',
    priceMicros: 4_990_000,
    currencyCode: 'USD',
    storeKitProductId: 'app.broono.coins.vault',
    playBillingProductId: 'coins_vault',
    coinAmount: 3_200,
    bonusItemIds: [],
    badge: 'Most value',
  },
  {
    id: 'starter_bundle',
    type: 'non-consumable',
    displayName: 'Starter Tray',
    description: 'Coins, two boosters, and launch cosmetics.',
    localizedPrice: '$1.99',
    priceMicros: 1_990_000,
    currencyCode: 'USD',
    storeKitProductId: 'app.broono.bundle.starter',
    playBillingProductId: 'starter_bundle',
    coinAmount: 900,
    bonusItemIds: ['gummy-cape', 'star-tray'],
    badge: 'Launch offer',
  },
  {
    id: 'care_pass_monthly',
    type: 'subscription',
    displayName: 'Snack Pass',
    description: 'Monthly mock pass with coins, boosters, and VIP styling.',
    localizedPrice: '$2.99/mo',
    priceMicros: 2_990_000,
    currencyCode: 'USD',
    storeKitProductId: 'app.broono.pass.monthly',
    playBillingProductId: 'care_pass_monthly',
    coinAmount: 1_200,
    bonusItemIds: ['vip-crown'],
    badge: 'Mock subscription',
  },
];

const receiptStorageKey = 'broono.mock.payment.receipts.v1';

const isStorePlatform = (platform: string): platform is StorePlatform => platform === 'app-store' || platform === 'play-store';

const readReceipts = (): PurchaseReceipt[] => {
  if (typeof globalThis.localStorage === 'undefined') return [];
  const raw = globalThis.localStorage.getItem(receiptStorageKey);
  if (!raw) return [];

  try {
    const receipts = JSON.parse(raw);
    return Array.isArray(receipts) ? (receipts as PurchaseReceipt[]) : [];
  } catch {
    globalThis.localStorage.removeItem(receiptStorageKey);
    return [];
  }
};

const writeReceipts = (receipts: PurchaseReceipt[]) => {
  if (typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.setItem(receiptStorageKey, JSON.stringify(receipts));
  }
};

export function createMockPaymentClient(platform: StorePlatform = 'app-store', clock: () => Date = () => new Date()): PaymentClient {
  const resolvedPlatform = isStorePlatform(platform) ? platform : 'app-store';

  return {
    platform: resolvedPlatform,
    async listProducts() {
      return paymentProducts;
    },
    async purchase(productId) {
      const product = paymentProducts.find((candidate) => candidate.id === productId);
      if (!product) throw new Error(`Unknown mocked payment product: ${productId}`);

      const now = clock();
      const purchasedAt = now.toISOString();
      const transactionId = `mock-${resolvedPlatform}-${productId}-${now.getTime().toString(36)}`;
      const receipt: PurchaseReceipt = {
        id: transactionId,
        productId,
        platform: resolvedPlatform,
        transactionId,
        purchaseToken: `sandbox-token-${productId}-${transactionId}`,
        purchasedAt,
        sandbox: true,
      };
      writeReceipts([receipt, ...readReceipts()]);
      return receipt;
    },
    async restorePurchases() {
      return readReceipts();
    },
  };
}
