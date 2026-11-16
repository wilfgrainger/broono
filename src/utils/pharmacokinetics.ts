import { PHARMACOKINETICS, type Ingredient } from './medications.ts'
import { daysBetween } from './date.ts'

export interface Injection {
  /** Local date `YYYY-MM-DD`. Doses are assumed to be taken at midday. */
  date: string
  doseMg: number
}

export interface LevelPoint {
  /** Days relative to today; negative is the past. */
  day: number
  /** Estimated level as a percentage of the steady-state peak at the reference dose. */
  level: number
}

const DOSE_HOUR = 0.5

/** Absorption rate constant that produces the label's time to peak for a given elimination rate. */
function absorptionRate(ke: number, tmax: number): number {
  // Solve tmax = ln(ka/ke) / (ka - ke) for ka > ke by bisection.
  let low = ke * 1.0001
  let high = 50
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2
    const t = Math.log(mid / ke) / (mid - ke)
    if (t > tmax) low = mid
    else high = mid
  }
  return (low + high) / 2
}

/** One-compartment model with first-order absorption (Bateman function), per mg dosed. */
function unitResponse(ingredient: Ingredient) {
  const { halfLifeDays, tmaxDays } = PHARMACOKINETICS[ingredient]
  const ke = Math.LN2 / halfLifeDays
  const ka = absorptionRate(ke, tmaxDays)
  const scale = ka / (ka - ke)
  return (t: number) => (t <= 0 ? 0 : scale * (Math.exp(-ke * t) - Math.exp(-ka * t)))
}

function amountAt(t: number, doses: { t: number; mg: number }[], response: (t: number) => number) {
  let total = 0
  for (const dose of doses) total += dose.mg * response(t - dose.t)
  return total
}

/** Peak level reached after many weekly doses of `doseMg` (the steady state). */
export function steadyStatePeak(ingredient: Ingredient, doseMg: number): number {
  const response = unitResponse(ingredient)
  const doses = Array.from({ length: 20 }, (_, week) => ({ t: week * 7, mg: doseMg }))
  let peak = 0
  for (let t = 19 * 7; t <= 20 * 7; t += 0.05) peak = Math.max(peak, amountAt(t, doses, response))
  return peak
}

/**
 * Estimated relative medication level over a window around today, from the
 * logged injections. 100% is the peak a person reaches after taking the
 * reference dose every week for several weeks. It is a modelling estimate for
 * context, not a measurement.
 */
export function estimateLevels(
  injections: Injection[],
  ingredient: Ingredient,
  options: { today: string; fromDay: number; toDay: number; stepDays?: number; referenceDoseMg?: number },
): LevelPoint[] {
  const valid = injections.filter((injection) => injection.doseMg > 0)
  const referenceDose = options.referenceDoseMg && options.referenceDoseMg > 0
    ? options.referenceDoseMg
    : valid[0]?.doseMg ?? 0
  if (referenceDose <= 0 || valid.length === 0) return []

  const response = unitResponse(ingredient)
  const reference = steadyStatePeak(ingredient, referenceDose)
  const doses = valid.map((injection) => ({ t: daysBetween(injection.date, options.today) + DOSE_HOUR, mg: injection.doseMg }))
  const step = options.stepDays ?? 0.25
  const points: LevelPoint[] = []

  for (let day = options.fromDay; day <= options.toDay + 1e-9; day += step) {
    // "Now" is the middle of today.
    const level = (amountAt(day + 0.5, doses, response) / reference) * 100
    points.push({ day: Math.round(day * 100) / 100, level: Math.round(level * 10) / 10 })
  }
  return points
}

/** The estimated level at midday today, or null without dosed injections. */
export function currentLevel(injections: Injection[], ingredient: Ingredient, today: string, referenceDoseMg?: number): number | null {
  const [point] = estimateLevels(injections, ingredient, { today, fromDay: 0, toDay: 0, referenceDoseMg })
  return point ? Math.round(point.level) : null
}
