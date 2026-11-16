// Weights are stored as one number per entry: kilograms when the unit is `kg`,
// total pounds when it is `lbs` or `st`. `st` only changes how pounds are
// entered and displayed (stones and pounds).
export type WeightUnit = 'kg' | 'lbs' | 'st'

export const POUNDS_PER_STONE = 14
const POUNDS_PER_KG = 2.2046226218

const MAX_WEIGHT: Record<WeightUnit, number> = { kg: 500, lbs: 1100, st: 1100 }

export const WEIGHT_UNIT_OPTIONS: { unit: WeightUnit; label: string }[] = [
  { unit: 'kg', label: 'Kilograms' },
  { unit: 'lbs', label: 'Pounds' },
  { unit: 'st', label: 'Stones & pounds' },
]

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function formatDecimal(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

const usesPounds = (unit: WeightUnit) => unit !== 'kg'

/** Unit of the single stored number: `kg` or `lbs`. */
export function getWeightInputUnitLabel(unit: WeightUnit): string {
  return usesPounds(unit) ? 'lbs' : 'kg'
}

export function getWeightUnitName(unit: WeightUnit): string {
  return WEIGHT_UNIT_OPTIONS.find((option) => option.unit === unit)?.label ?? unit
}

/** A sensible default for a new user, based on the device language. */
export function guessWeightUnit(language: string | undefined): WeightUnit {
  const region = language?.split('-')[1]?.toUpperCase()
  if (region === 'GB' || region === 'IE') return 'st'
  if (region === 'US') return 'lbs'
  return 'kg'
}

/** Converts a stored weight when the user changes unit. */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (usesPounds(from) === usesPounds(to)) return value
  const converted = usesPounds(to) ? value * POUNDS_PER_KG : value / POUNDS_PER_KG
  return roundToTenth(converted)
}

/** Returns a valid stored weight, or null when the value is missing or implausible. */
export function validateWeight(value: number, unit: WeightUnit): number | null {
  if (!Number.isFinite(value) || value <= 0 || value > MAX_WEIGHT[unit]) return null
  return roundToTenth(value)
}

export function splitStones(totalPounds: number): { stones: number; pounds: number } {
  const rounded = roundToTenth(Math.abs(totalPounds))
  let stones = Math.floor(rounded / POUNDS_PER_STONE)
  let pounds = roundToTenth(rounded - stones * POUNDS_PER_STONE)

  if (pounds >= POUNDS_PER_STONE) {
    stones += 1
    pounds = 0
  }

  return { stones, pounds }
}

/** Formats a weight or a weight difference with its unit, e.g. `82.3 kg`, `195 lbs`, `13 st 13 lbs`. */
export function formatWeight(value: number, unit: WeightUnit): string {
  const sign = value < 0 ? '-' : ''
  const absoluteValue = roundToTenth(Math.abs(value))

  if (unit !== 'st') {
    return `${sign}${formatDecimal(absoluteValue)} ${getWeightInputUnitLabel(unit)}`
  }

  const { stones, pounds } = splitStones(absoluteValue)
  if (stones === 0) return `${sign}${formatDecimal(pounds)} lbs`
  if (pounds === 0) return `${sign}${stones} st`
  return `${sign}${stones} st ${formatDecimal(pounds)} lbs`
}
