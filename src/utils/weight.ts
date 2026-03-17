import type { WeightUnit } from '../store'

const POUNDS_PER_STONE = 14

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function formatDecimal(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

export function getWeightUnitLabel(unit: WeightUnit): string {
  return unit === 'lbs' ? 'st/lbs' : 'kg'
}

export function formatWeightValue(value: number, unit: WeightUnit): string {
  if (unit === 'kg') {
    return formatDecimal(roundToTenth(value))
  }

  const absoluteValue = Math.abs(roundToTenth(value))
  let stones = Math.floor(absoluteValue / POUNDS_PER_STONE)
  let pounds = roundToTenth(absoluteValue - (stones * POUNDS_PER_STONE))

  if (pounds >= POUNDS_PER_STONE) {
    stones += 1
    pounds = 0
  }

  if (stones === 0) {
    return formatDecimal(pounds)
  }

  if (pounds === 0) {
    return `${stones} st`
  }

  return `${stones} st ${formatDecimal(pounds)} lbs`
}

export function formatWeight(value: number, unit: WeightUnit): string {
  if (unit === 'kg') {
    return `${formatWeightValue(value, unit)} kg`
  }

  const sign = value < 0 ? '-' : ''
  const absoluteValue = Math.abs(value)

  return `${sign}${formatWeightValue(absoluteValue, unit)}`
}
