import { parseLocalISODate } from './date.ts'

export type MedicationName = 'Zepbound' | 'Mounjaro' | 'Wegovy' | 'Ozempic'

export function getMedicationLevel(
  lastLogDate: string | undefined,
  medicationName: MedicationName
): number {
  if (!lastLogDate) return 0
  const halfLifeDays = medicationName === 'Ozempic' || medicationName === 'Wegovy' ? 7 : 5
  const daysSince =
    (Date.now() - parseLocalISODate(lastLogDate).getTime()) /
    (1000 * 60 * 60 * 24)
  const level = Math.round(Math.pow(0.5, Math.max(daysSince, 0) / halfLifeDays) * 100)
  return Math.min(Math.max(level, 0), 100)
}

export function getDaysUntilNextDose(injectionDayOfWeek: number): number {
  const now = new Date()
  const currentDay = now.getDay()
  let daysUntil = injectionDayOfWeek - currentDay
  if (daysUntil <= 0) daysUntil += 7
  return daysUntil
}
