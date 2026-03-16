export type SubscriptionStatus = 'free' | 'pro'

export type VerifySubscriptionResponse = {
  verified: boolean
  status: SubscriptionStatus
}

export const getSubscriptionStatusFromPlayState = (subscriptionState: string): SubscriptionStatus => {
  return subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ||
    subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
    ? 'pro'
    : 'free'
}

export const buildVerifySubscriptionResponse = (
  verified: boolean,
  status: SubscriptionStatus,
): VerifySubscriptionResponse => ({ verified, status })
