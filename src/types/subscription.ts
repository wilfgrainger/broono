export type SubscriptionStatus = 'free' | 'pro'

export type VerifySubscriptionResponse = {
  verified: boolean
  status: SubscriptionStatus
}

export const isUnlockedSubscription = (response: VerifySubscriptionResponse): boolean => {
  return response.verified === true && response.status === 'pro'
}
