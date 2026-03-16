export type SubscriptionStatus = 'pro' | 'free'

const UPGRADE_NOTIFICATION_TYPES = new Set<number>([
  1, // SUBSCRIPTION_RECOVERED
  2, // SUBSCRIPTION_RENEWED
  4, // SUBSCRIPTION_PURCHASED
  7, // SUBSCRIPTION_RESTARTED
])

const DOWNGRADE_NOTIFICATION_TYPES = new Set<number>([
  3,  // SUBSCRIPTION_CANCELED
  5,  // SUBSCRIPTION_ON_HOLD
  10, // SUBSCRIPTION_PAUSED
  12, // SUBSCRIPTION_EXPIRED
  13, // SUBSCRIPTION_REVOKED
])

export const mapRtdnNotificationTypeToStatus = (notificationType: number): SubscriptionStatus | null => {
  if (UPGRADE_NOTIFICATION_TYPES.has(notificationType)) {
    return 'pro'
  }

  if (DOWNGRADE_NOTIFICATION_TYPES.has(notificationType)) {
    return 'free'
  }

  return null
}

