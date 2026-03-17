/**
 * Billing service for Broono Pro.
 *
 * Purchases are accepted only in the Android app through Google Play Billing.
 * Web surfaces can display plan details, but they cannot start checkout.
 */

import { Capacitor } from '@capacitor/core'
import { PURCHASE_TYPE } from '@capgo/native-purchases'

export interface SubscriptionInfo {
  status: 'unknown' | 'free' | 'trial' | 'pro' | 'expired' | 'canceled'
  expiresAt?: string
  trialEndsAt?: string
  productId?: string
  purchaseToken?: string
  platform: 'android' | 'web'
}

export interface ProductInfo {
  productId: string
  title: string
  description: string
  price: string
  trialPeriod?: string
}

export const PRODUCT_ID = 'broono_pro_monthly'
export const MONTHLY_PRICE = '$2.99'
export const TRIAL_DAYS = 2

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export function getPlatform(): 'android' | 'web' {
  return Capacitor.getPlatform() === 'android' ? 'android' : 'web'
}

let nativePurchasesPlugin: typeof import('@capgo/native-purchases').NativePurchases | null = null

async function getNativePurchases() {
  if (!nativePurchasesPlugin) {
    const mod = await import('@capgo/native-purchases')
    nativePurchasesPlugin = mod.NativePurchases
  }
  return nativePurchasesPlugin
}

export async function initBilling(): Promise<void> {
  if (!isNativePlatform()) return

  try {
    const NativePurchases = await getNativePurchases()
    await NativePurchases.restorePurchases()
  } catch (err) {
    console.warn('[Billing] Init failed (expected in dev):', err)
  }
}

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
      productType: PURCHASE_TYPE.SUBS,
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

export async function purchaseSubscription(): Promise<{ success: boolean; productId?: string; purchaseToken?: string; error?: string }> {
  if (!isNativePlatform()) {
    return { success: false, error: 'Subscriptions are only available in the Android app through Google Play.' }
  }

  try {
    const NativePurchases = await getNativePurchases()
    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.SUBS,
    })

    if (!transaction.purchaseToken) {
      return { success: false, error: 'Purchase completed but no purchase token was returned.' }
    }

    return {
      success: true,
      productId: transaction.productIdentifier,
      purchaseToken: transaction.purchaseToken,
    }
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('userCancelled')) {
      return { success: false, error: 'Purchase cancelled' }
    }
    return { success: false, error: error.message || 'Purchase failed' }
  }
}

export async function restorePurchases(): Promise<SubscriptionInfo> {
  if (!isNativePlatform()) {
    return { status: 'unknown', platform: 'web' }
  }

  try {
    const NativePurchases = await getNativePurchases()
    await NativePurchases.restorePurchases()

    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.SUBS,
    })

    if (purchases && purchases.length > 0) {
      const purchase = purchases[0]
      return {
        status: 'pro',
        productId: purchase.productIdentifier,
        purchaseToken: purchase.purchaseToken,
        platform: 'android',
      }
    }

    return { status: 'free', platform: 'android' }
  } catch (err) {
    console.warn('[Billing] restorePurchases failed:', err)
    return { status: 'unknown', platform: 'android' }
  }
}

export async function getSubscriptionStatus(): Promise<SubscriptionInfo> {
  if (!isNativePlatform()) {
    return { status: 'unknown', platform: 'web' }
  }

  return restorePurchases()
}
