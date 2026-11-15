import { addDays, parseLocalISODate, toLocalISODate } from './date.ts'

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * A weekly repeating calendar event, with an alert at the time of the event,
 * that the user's own calendar app reminds them with. Times are "floating"
 * (no time zone), so the reminder stays at the same local time when travelling
 * or when the clocks change.
 */
export function buildWeeklyReminderIcs(options: { dayOfWeek: number; time: string; title: string; description: string; today?: string; uid: string }): string {
  const today = options.today ?? toLocalISODate()
  const offset = (options.dayOfWeek - parseLocalISODate(today).getDay() + 7) % 7
  const first = addDays(today, offset).replace(/-/g, '')
  const [hours, minutes] = options.time.split(':')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Broono//Local edition//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${options.uid}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${first}T${hours}${minutes}00`,
    'DURATION:PT15M',
    `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[options.dayOfWeek]}`,
    `SUMMARY:${escapeText(options.title)}`,
    `DESCRIPTION:${escapeText(options.description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(options.title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.join('\r\n')}\r\n`
}
