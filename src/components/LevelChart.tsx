import { useMemo } from 'react'
import DataTable from './DataTable'
import { addDays, formatShortDate } from '../utils/date'
import { formatDose, type Ingredient } from '../utils/medications'
import { estimateLevels, type Injection } from '../utils/pharmacokinetics'

interface LevelChartProps {
  injections: Injection[]
  ingredient: Ingredient
  today: string
  referenceDoseMg: number
  /** Next scheduled dose, included in the projection when set. */
  nextDose?: Injection | null
  pastDays?: number
  futureDays?: number
}

const WIDTH = 320
const HEIGHT = 120
const PAD = { top: 10, right: 6, bottom: 22, left: 6 }

/** Estimated medication level for recent weeks, with the next week projected. */
export default function LevelChart({ injections, ingredient, today, referenceDoseMg, nextDose, pastDays = 28, futureDays = 7 }: LevelChartProps) {
  const points = useMemo(() => estimateLevels(
    nextDose ? [...injections, nextDose] : injections,
    ingredient,
    { today, fromDay: -pastDays, toDay: futureDays, stepDays: 0.25, referenceDoseMg },
  ), [injections, nextDose, ingredient, today, referenceDoseMg, pastDays, futureDays])

  if (points.length === 0) return null

  const maxLevel = Math.max(100, ...points.map((point) => point.level))
  const x = (day: number) => PAD.left + ((day + pastDays) / (pastDays + futureDays)) * (WIDTH - PAD.left - PAD.right)
  const y = (level: number) => PAD.top + (1 - level / maxLevel) * (HEIGHT - PAD.top - PAD.bottom)
  const path = (subset: typeof points) => subset.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.day).toFixed(1)},${y(point.level).toFixed(1)}`).join(' ')
  const past = points.filter((point) => point.day <= 0)
  const future = points.filter((point) => point.day >= 0)
  const baseline = y(0)
  const area = `${path(past)} L${x(0).toFixed(1)},${baseline} L${x(-pastDays).toFixed(1)},${baseline} Z`
  const now = past.at(-1)!
  const injectionDays = injections
    .map((injection) => ({ ...injection, day: Math.round((Date.parse(`${injection.date}T12:00`) - Date.parse(`${today}T12:00`)) / 86_400_000) }))
    .filter((injection) => injection.day >= -pastDays && injection.day <= 0)

  const weekly = [-pastDays, -21, -14, -7, 0, futureDays].filter((day, index, all) => all.indexOf(day) === index && day >= -pastDays)
  const summary = `Estimated level over the last ${pastDays / 7} weeks: ${Math.round(now.level)}% now, `
    + `peak ${Math.round(Math.max(...past.map((point) => point.level)))}%. ${injectionDays.length} logged ${injectionDays.length === 1 ? 'injection' : 'injections'} in this period.`

  return (
    <figure className="level-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} preserveAspectRatio="none">
        <line className="chart-gridline" x1={PAD.left} x2={WIDTH - PAD.right} y1={y(100)} y2={y(100)} />
        <path className="level-area" d={area} />
        <path className="level-line" d={path(past)} />
        <path className="level-line projected" d={path(future)} />
        <line className="chart-today" x1={x(0)} x2={x(0)} y1={PAD.top - 4} y2={baseline} />
        {injectionDays.map((injection) => (
          <circle key={injection.date} className="level-dose" cx={x(injection.day)} cy={baseline} r={3} />
        ))}
        <circle className="level-now" cx={x(0)} cy={y(now.level)} r={4} />
      </svg>
      <div className="chart-axis" aria-hidden="true">
        <span>{formatShortDate(addDays(today, -pastDays))}</span>
        <span>Today</span>
        <span>{formatShortDate(addDays(today, futureDays))}</span>
      </div>
      <figcaption className="chart-caption">
        Solid line: estimate from your logged injections (dots). Dashed: the coming week{nextDose ? ', including your next scheduled dose' : ''}. 100% is the usual peak after several weeks on your current dose.
      </figcaption>
      <DataTable
        caption="Estimated level by week"
        columns={['Date', 'Estimated level', 'Injection']}
        rows={weekly.map((day) => {
          const point = points.reduce((best, candidate) => Math.abs(candidate.day - day) < Math.abs(best.day - day) ? candidate : best)
          const date = addDays(today, day)
          const dosed = injections.find((injection) => injection.date === date)
          return [day === 0 ? 'Today' : formatShortDate(date), `${Math.round(point.level)}%${day > 0 ? ' (projected)' : ''}`, dosed ? formatDose(dosed.doseMg) || 'Yes' : '']
        })}
      />
    </figure>
  )
}
