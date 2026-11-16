import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseLocalISODate, toLocalISODate } from './date.ts'
import { convertWeight, formatWeight, guessWeightUnit, splitStones, validateWeight } from './weight.ts'

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
  assert.equal(formatWeight(195, 'lbs'), '195 lbs')
  assert.equal(formatWeight(195, 'st'), '13 st 13 lbs')
  assert.equal(formatWeight(196, 'st'), '14 st')
  // Below one stone there is no stones part, but the unit must still show.
  assert.equal(formatWeight(5, 'st'), '5 lbs')
  assert.equal(formatWeight(-5, 'st'), '-5 lbs')
  // 27.96 lbs rounds to 28.0, which must roll over to 2 st rather than "1 st 14 lbs".
  assert.equal(formatWeight(27.96, 'st'), '2 st')
})

test('convertWeight only converts between kilograms and pound-based units', () => {
  assert.equal(convertWeight(200, 'lbs', 'st'), 200)
  assert.equal(convertWeight(200, 'st', 'kg'), 90.7)
  assert.equal(convertWeight(90.7, 'kg', 'lbs'), 200)
  assert.equal(convertWeight(0, 'kg', 'lbs'), 0)
})

test('validateWeight rejects missing and implausible values', () => {
  assert.equal(validateWeight(82.34, 'kg'), 82.3)
  for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY, 501]) {
    assert.equal(validateWeight(bad, 'kg'), null)
  }
  assert.equal(validateWeight(1100, 'lbs'), 1100)
  assert.equal(validateWeight(1101, 'st'), null)
})

test('splitStones and guessWeightUnit', () => {
  assert.deepEqual(splitStones(200), { stones: 14, pounds: 4 })
  assert.deepEqual(splitStones(13.96), { stones: 1, pounds: 0 })
  assert.equal(guessWeightUnit('en-GB'), 'st')
  assert.equal(guessWeightUnit('en-US'), 'lbs')
  assert.equal(guessWeightUnit('de-DE'), 'kg')
  assert.equal(guessWeightUnit(undefined), 'kg')
})
