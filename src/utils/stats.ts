import { daysBetween } from './date.ts'

export const INJECTION_SITES = [
  'Left Stomach', 'Right Stomach', 'Left Thigh', 'Right Thigh', 'Left Arm', 'Right Arm',
] as const
export type InjectionSite = typeof INJECTION_SITES[number]

interface WeightEntry { date: string; weight: number }
interface SiteEntry { date: string; site: string }
interface SymptomEntry { symptoms: string[] }

/**
 * Suggests the site used least recently (never-used sites first, in a fixed
 * order), so injections rotate around all six areas.
 */
export function suggestNextSite(logs: SiteEntry[]): { site: InjectionSite; lastUsed: string | null } {
  let best: { site: InjectionSite; lastUsed: string | null } | null = null
  for (const site of INJECTION_SITES) {
    const lastUsed = logs.filter((log) => log.site === site).map((log) => log.date).sort().at(-1) ?? null
    if (lastUsed === null) return { site, lastUsed }
    if (!best || (best.lastUsed !== null && lastUsed < best.lastUsed)) best = { site, lastUsed }
  }
  return best!
}

/** Percentage of starting weight lost (negative for a gain), to one decimal place. */
export function percentChange(start: number, current: number): number {
  if (!(start > 0)) return 0
  return Math.round(((start - current) / start) * 1000) / 10
}

/** Milestones that are clinically meaningful in GLP-1 treatment. */
export const MILESTONES = [5, 10, 15, 20, 25] as const

/**
 * Average change per week over roughly the last four weeks of logs
 * (negative means losing). Null when there is not enough history.
 */
export function weeklyRate(logs: WeightEntry[]): number | null {
  if (logs.length < 2) return null
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted[sorted.length - 1]
  const windowStart = sorted.find((log) => daysBetween(latest.date, log.date) <= 35) ?? sorted[0]
  const days = daysBetween(latest.date, windowStart.date)
  if (days < 6) return null
  return Math.round(((latest.weight - windowStart.weight) / days) * 7 * 10) / 10
}

/** Body mass index from a weight in kilograms and a height in centimetres. */
export function bmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0) || !(heightCm >= 100 && heightCm <= 250)) return null
  return Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10
}

/** How often each side effect appears in the given logs, most frequent first. */
export function symptomCounts(logs: SymptomEntry[]): { symptom: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const log of logs) {
    for (const symptom of log.symptoms) {
      if (symptom !== 'None') counts.set(symptom, (counts.get(symptom) ?? 0) + 1)
    }
  }
  return [...counts].map(([symptom, count]) => ({ symptom, count })).sort((a, b) => b.count - a.count || a.symptom.localeCompare(b.symptom))
}
