// Calendar dates are stored as plain `YYYY-MM-DD` strings in the user's own
// time zone. `Date#toISOString()` reports the UTC date, which is the previous
// or next day for part of every day outside UTC, so it is never used here.

export function toLocalISODate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Parses a stored `YYYY-MM-DD` string as local midnight. */
export function parseLocalISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function formatShortDate(isoDate: string): string {
  const date = parseLocalISODate(isoDate)
  // Entries from another year would otherwise be ambiguous.
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDayOfMonth(isoDate: string): string {
  return `${parseLocalISODate(isoDate).getDate()}`
}
