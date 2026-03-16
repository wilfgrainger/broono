import type { VerifySubscriptionResponse } from '../types/subscription.ts'

export const DEFAULT_LOCKED_SUBSCRIPTION_RESPONSE: VerifySubscriptionResponse = {
  verified: false,
  status: 'free',
}

export const parseVerifySubscriptionResponse = (payload: unknown): VerifySubscriptionResponse => {
  if (!payload || typeof payload !== 'object') {
    return DEFAULT_LOCKED_SUBSCRIPTION_RESPONSE
  }

  const data = payload as { verified?: unknown; status?: unknown }
  const status = data.status === 'pro' ? 'pro' : 'free'

  return {
    verified: data.verified === true,
    status,
  }
}
