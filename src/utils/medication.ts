export type MedicationName = 'Zepbound' | 'Mounjaro' | 'Wegovy' | 'Ozempic'

export function getMedicationLevel(
  lastLogDate: string | undefined,
  medicationName: MedicationName
): number {
  if (!lastLogDate) return 0
  const halfLifeDays = medicationName === 'Ozempic' || medicationName === 'Wegovy' ? 7 : 5
  const daysSince =
    (Date.now() - new Date(lastLogDate + 'T00:00:00').getTime()) /
    (1000 * 60 * 60 * 24)
  return Math.max(Math.round(Math.pow(0.5, daysSince / halfLifeDays) * 100), 0)
}

export function getDaysUntilNextDose(injectionDayOfWeek: number): number {
  const now = new Date()
  const currentDay = now.getDay()
  let daysUntil = injectionDayOfWeek - currentDay
  if (daysUntil <= 0) daysUntil += 7
  return daysUntil
}
