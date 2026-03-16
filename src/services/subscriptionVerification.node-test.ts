import test from 'node:test'
import assert from 'node:assert/strict'
import { isUnlockedSubscription } from '../types/subscription.ts'
import { parseVerifySubscriptionResponse } from './subscriptionVerification.ts'

test('verified active purchase returns unlock success', () => {
  const parsed = parseVerifySubscriptionResponse({ verified: true, status: 'pro' })

  assert.equal(parsed.verified, true)
  assert.equal(parsed.status, 'pro')
  assert.equal(isUnlockedSubscription(parsed), true)
})

test('unverified or expired purchase keeps user locked', () => {
  const unverified = parseVerifySubscriptionResponse({ verified: false, status: 'pro' })
  const expired = parseVerifySubscriptionResponse({ verified: true, status: 'free' })

  assert.equal(isUnlockedSubscription(unverified), false)
  assert.equal(isUnlockedSubscription(expired), false)
})
