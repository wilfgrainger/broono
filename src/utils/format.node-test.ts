import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseLocalISODate, toLocalISODate } from './date.ts'
import { formatWeight, formatWeightValue } from './weight.ts'

test('toLocalISODate uses the local calendar day, not the UTC day', () => {
  // Late evening and just after midnight local time are the cases where
  // Date#toISOString() reports a different day in zones away from UTC.
  assert.equal(toLocalISODate(new Date(2026, 6, 4, 23, 30)), '2026-07-04')
  assert.equal(toLocalISODate(new Date(2026, 6, 5, 0, 15)), '2026-07-05')
  assert.equal(toLocalISODate(new Date(2026, 0, 9, 12)), '2026-01-09')
})

test('parseLocalISODate round-trips through toLocalISODate', () => {
  for (const iso of ['2026-01-01', '2026-03-29', '2026-10-25', '2026-12-31']) {
    const parsed = parseLocalISODate(iso)
    assert.equal(parsed.getHours(), 0)
    assert.equal(toLocalISODate(parsed), iso)
  }
})

test('formatWeight always includes a unit', () => {
  assert.equal(formatWeight(82.34, 'kg'), '82.3 kg')
  assert.equal(formatWeight(195, 'lbs'), '13 st 13 lbs')
  assert.equal(formatWeight(196, 'lbs'), '14 st')
  // Below one stone the value used to render as a bare number ("5").
  assert.equal(formatWeight(5, 'lbs'), '5 lbs')
  assert.equal(formatWeight(0.5, 'lbs'), '0.5 lbs')
  assert.equal(formatWeight(-5, 'lbs'), '-5 lbs')
})

test('formatWeightValue rolls rounded pounds over into stones', () => {
  assert.equal(formatWeightValue(27.96, 'lbs'), '2 st')
  assert.equal(formatWeightValue(70, 'kg'), '70')
})
