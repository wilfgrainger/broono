import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addDays, daysBetween } from './date.ts'
import { getDoseStatus } from './medication.ts'
import { formatDose, parseDose } from './medications.ts'
import { currentLevel, estimateLevels, steadyStatePeak } from './pharmacokinetics.ts'
import { bmi, percentChange, suggestNextSite, symptomCounts, weeklyRate } from './stats.ts'

test('calendar day arithmetic is DST-safe', () => {
  // Spans the UK and EU clock changes.
  assert.equal(daysBetween('2026-03-30', '2026-03-28'), 2)
  assert.equal(daysBetween('2026-10-26', '2026-10-24'), 2)
  assert.equal(addDays('2026-03-28', 2), '2026-03-30')
  assert.equal(addDays('2026-12-30', 3), '2027-01-02')
})

test('dose status is due today until logged, then a week away', () => {
  // 2026-11-18 is a Wednesday (3).
  assert.deepEqual(getDoseStatus(3, '2026-11-11', '2026-11-18'), { nextDate: '2026-11-18', daysUntil: 0, takenToday: false })
  assert.deepEqual(getDoseStatus(3, '2026-11-18', '2026-11-18'), { nextDate: '2026-11-25', daysUntil: 7, takenToday: true })
  assert.equal(getDoseStatus(5, undefined, '2026-11-18').daysUntil, 2)
})

test('doses parse from old free text and format consistently', () => {
  assert.equal(parseDose('5mg'), 5)
  assert.equal(parseDose('2,5 mg'), 2.5)
  assert.equal(parseDose(''), 0)
  assert.equal(parseDose(500), 0)
  assert.equal(formatDose(7.5), '7.5 mg')
  assert.equal(formatDose(0.25), '0.25 mg')
  assert.equal(formatDose(0), '')
})

test('weekly dosing accumulates toward the steady-state peak', () => {
  const today = '2026-11-18'
  const weekly = Array.from({ length: 12 }, (_, week) => ({ date: addDays(today, -7 * (11 - week)), doseMg: 5 }))
  const after12 = currentLevel(weekly, 'tirzepatide', addDays(today, 1))!
  const afterOne = currentLevel(weekly.slice(-1), 'tirzepatide', addDays(today, 1))!
  assert.ok(afterOne < after12, 'one dose gives a lower level than twelve')
  assert.ok(after12 > 90 && after12 <= 101, `steady state peaks near 100% (got ${after12})`)
  // Semaglutide's longer half-life accumulates more than tirzepatide's.
  assert.ok(steadyStatePeak('semaglutide', 1) / 1 > steadyStatePeak('tirzepatide', 1) / 1)
})

test('level estimate rises after a dose, peaks, then decays', () => {
  const points = estimateLevels([{ date: '2026-11-18', doseMg: 2.5 }], 'tirzepatide', { today: '2026-11-18', fromDay: -1, toDay: 14, stepDays: 1 })
  const levels = points.map((point) => point.level)
  assert.equal(levels[0], 0)
  const peakIndex = levels.indexOf(Math.max(...levels))
  assert.ok(peakIndex >= 1 && peakIndex <= 3, `peaks within a few days (index ${peakIndex})`)
  assert.ok(levels.at(-1)! < levels[peakIndex] / 3, 'mostly gone two weeks later')
  assert.deepEqual(estimateLevels([], 'semaglutide', { today: '2026-11-18', fromDay: 0, toDay: 1 }), [])
})

test('site rotation suggests never-used sites, then the least recent', () => {
  assert.deepEqual(suggestNextSite([]), { site: 'Left Stomach', lastUsed: null })
  assert.equal(suggestNextSite([{ date: '2026-11-01', site: 'Left Stomach' }]).site, 'Right Stomach')
  const allUsed = ['Left Stomach', 'Right Stomach', 'Left Thigh', 'Right Thigh', 'Left Arm', 'Right Arm']
    .map((site, index) => ({ site, date: addDays('2026-10-01', index * 7) }))
  allUsed[3].date = '2026-09-01'
  assert.deepEqual(suggestNextSite(allUsed), { site: 'Right Thigh', lastUsed: '2026-09-01' })
})

test('progress statistics', () => {
  assert.equal(percentChange(100, 90), 10)
  assert.equal(percentChange(100, 103), -3)
  assert.equal(percentChange(0, 90), 0)
  assert.equal(weeklyRate([{ date: '2026-11-01', weight: 100 }]), null)
  assert.equal(weeklyRate([{ date: '2026-10-04', weight: 100 }, { date: '2026-11-01', weight: 96 }]), -1)
  assert.equal(bmi(80, 180), 24.7)
  assert.equal(bmi(80, 0), null)
  assert.deepEqual(symptomCounts([{ symptoms: ['Nausea'] }, { symptoms: ['Nausea', 'Fatigue'] }, { symptoms: ['None'] }]), [
    { symptom: 'Nausea', count: 2 }, { symptom: 'Fatigue', count: 1 },
  ])
})

test('calendar reminder repeats weekly on the injection day at a floating local time', async () => {
  const { buildWeeklyReminderIcs } = await import('./calendar.ts')
  const ics = buildWeeklyReminderIcs({ dayOfWeek: 3, time: '08:30', title: 'Mounjaro, 7.5 mg', description: 'Log it; then rotate site.', today: '2026-11-16', uid: 'test@broono.app' })
  assert.match(ics, /DTSTART:20261118T083000\r\n/)
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=WE\r\n/)
  assert.match(ics, /SUMMARY:Mounjaro\\, 7\.5 mg\r\n/)
  assert.match(ics, /DESCRIPTION:Log it\\; then rotate site\.\r\n/)
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
})

test('CSV cells are quoted and formula-like text is neutralised', async () => {
  const { csvCell, toCsv } = await import('./csv.ts')
  assert.equal(csvCell('plain'), 'plain')
  assert.equal(csvCell('a, b'), '"a, b"')
  assert.equal(csvCell('say "hi"'), '"say ""hi"""')
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`)
  assert.equal(csvCell(-2.5), '-2.5')
  assert.equal(toCsv(['a', 'b'], [[1, 'x']]), 'a,b\r\n1,x\r\n')
})
