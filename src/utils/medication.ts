import { addDays, parseLocalISODate, toLocalISODate } from './date.ts'

export type { MedicationName } from './medications.ts'

/** Days until the next scheduled injection day; 7 on the injection day itself. */
export function getDaysUntilNextDose(injectionDayOfWeek: number): number {
  const currentDay = new Date().getDay()
  let daysUntil = injectionDayOfWeek - currentDay
  if (daysUntil <= 0) daysUntil += 7
  return daysUntil
}

export interface DoseStatus {
  /** Date of the next scheduled injection (today when today is the day and it is not yet logged). */
  nextDate: string
  /** Days from today to `nextDate`. */
  daysUntil: number
  /** True when an injection is already logged today. */
  takenToday: boolean
}

/** Works out the next scheduled dose from the weekly injection day and the last logged injection. */
export function getDoseStatus(injectionDayOfWeek: number, lastInjectionDate: string | undefined, today = toLocalISODate()): DoseStatus {
  const weekday = parseLocalISODate(today).getDay()
  const daysToDay = (injectionDayOfWeek - weekday + 7) % 7
  const takenToday = lastInjectionDate === today
  // On the injection day, the dose is due today until it has been logged.
  const daysUntil = daysToDay === 0 && takenToday ? 7 : daysToDay
  return { nextDate: addDays(today, daysUntil), daysUntil, takenToday }
}
