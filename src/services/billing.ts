/**
 * Billing Service – Platform-aware subscription management
 *
 * On Android (Capacitor native): Uses Google Play Billing via @capgo/native-purchases
 * On Web: Falls back to Stripe checkout (existing implementation)
 *
 * Product configuration:
 *   - Product ID: "broono_pro_monthly" (configured in Google Play Console)
 *   - Price: $2.99/month
 *   - Free trial: 2 days (configured in Google Play Console offer)
 */

import { Capacitor } from '@capacitor/core'

// ---------- Types ----------

export interface SubscriptionInfo {
  status: 'unknown' | 'free' | 'trial' | 'pro' | 'expired' | 'canceled'
  expiresAt?: string
  trialEndsAt?: string
  productId?: string
  platform: 'android' | 'web'
}

export interface ProductInfo {
  productId: string
  title: string
  description: string
  price: string
  trialPeriod?: string
}

// ---------- Constants ----------

export const PRODUCT_ID = 'broono_pro_monthly'
export const MONTHLY_PRICE = '$2.99'
export const TRIAL_DAYS = 2

// ---------- Platform detection ----------

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export function getPlatform(): 'android' | 'web' {
  return Capacitor.getPlatform() === 'android' ? 'android' : 'web'
}

// ---------- Native (Android) billing via @capgo/native-purchases ----------

let nativePurchasesPlugin: typeof import('@capgo/native-purchases').NativePurchases | null = null

async function getNativePurchases() {
  if (!nativePurchasesPlugin) {
    const mod = await import('@capgo/native-purchases')
    nativePurchasesPlugin = mod.NativePurchases
  }
  return nativePurchasesPlugin
}

/**
 * Initialize billing – call once at app startup
 */
export async function initBilling(): Promise<void> {
  if (!isNativePlatform()) return

  try {
    const NativePurchases = await getNativePurchases()
    await NativePurchases.restorePurchases()
  } catch (err) {
    console.warn('[Billing] Init failed (expected in dev):', err)
  }
}

/**
 * Get available product/subscription info from the store
 */
export async function getProduct(): Promise<ProductInfo> {
  if (!isNativePlatform()) {
    return {
      productId: PRODUCT_ID,
      title: 'Broono Pro',
      description: 'Full access to all features',
      price: MONTHLY_PRICE,
      trialPeriod: `${TRIAL_DAYS} days free`,
    }
  }

  try {
    const NativePurchases = await getNativePurchases()
    const result = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: 'SUBS',
    })

    if (result.products && result.products.length > 0) {
      const product = result.products[0]
      return {
        productId: product.identifier,
        title: product.title || 'Broono Pro',
        description: product.description || 'Full access to all features',
        price: product.priceString || MONTHLY_PRICE,
        trialPeriod: `${TRIAL_DAYS} days free`,
      }
    }
  } catch (err) {
    console.warn('[Billing] getProduct failed:', err)
  }

  return {
    productId: PRODUCT_ID,
    title: 'Broono Pro',
    description: 'Full access to all features',
    price: MONTHLY_PRICE,
    trialPeriod: `${TRIAL_DAYS} days free`,
  }
}

/**
 * Purchase the subscription (launches Google Play purchase flow on Android)
 */
export async function purchaseSubscription(): Promise<{ success: boolean; error?: string }> {
  if (!isNativePlatform()) {
    return { success: false, error: 'Use web checkout for browser purchases' }
  }

  try {
    const NativePurchases = await getNativePurchases()
    await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: 'SUBS',
    })
    return { success: true }
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('userCancelled')) {
      return { success: false, error: 'Purchase cancelled' }
    }
    return { success: false, error: error.message || 'Purchase failed' }
  }
}

/**
 * Restore previous purchases (e.g. after reinstall)
 */
export async function restorePurchases(): Promise<SubscriptionInfo> {
  if (!isNativePlatform()) {
    return { status: 'unknown', platform: 'web' }
  }

  try {
    const NativePurchases = await getNativePurchases()
    const result = await NativePurchases.restorePurchases()

    if (result.activeSubscriptions && result.activeSubscriptions.length > 0) {
      return {
        status: 'pro',
        productId: result.activeSubscriptions[0],
        platform: 'android',
      }
    }

    return { status: 'free', platform: 'android' }
  } catch (err) {
    console.warn('[Billing] restorePurchases failed:', err)
    return { status: 'unknown', platform: 'android' }
  }
}

/**
 * Check current subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionInfo> {
  if (!isNativePlatform()) {
    return { status: 'unknown', platform: 'web' }
  }

  return restorePurchases()
}
