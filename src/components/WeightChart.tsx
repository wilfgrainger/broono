import DataTable from './DataTable'
import { daysBetween, formatShortDate } from '../utils/date'
import { formatWeight, type WeightUnit } from '../utils/weight'

interface WeightChartProps {
  logs: { date: string; weight: number }[]
  unit: WeightUnit
  startWeight: number
  goalWeight: number
}

const WIDTH = 320
const HEIGHT = 180
const PAD = { top: 14, right: 10, bottom: 8, left: 10 }

/** Weight over time with the starting weight and the goal as reference lines. */
export default function WeightChart({ logs, unit, startWeight, goalWeight }: WeightChartProps) {
  const points = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  if (points.length === 0) return null

  const first = points[0].date
  const last = points[points.length - 1].date
  const span = Math.max(daysBetween(last, first), 1)
  const references = [startWeight, goalWeight].filter((value) => value > 0)
  const values = [...points.map((point) => point.weight), ...references]
  const padding = Math.max((Math.max(...values) - Math.min(...values)) * 0.1, 1)
  const max = Math.max(...values) + padding
  const min = Math.min(...values) - padding

  const x = (date: string) => points.length === 1
    ? WIDTH / 2
    : PAD.left + (daysBetween(date, first) / span) * (WIDTH - PAD.left - PAD.right)
  const y = (weight: number) => PAD.top + ((max - weight) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom)
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.date).toFixed(1)},${y(point.weight).toFixed(1)}`).join(' ')
  const latest = points[points.length - 1]

  const summary = points.length === 1
    ? `One weigh-in: ${formatWeight(latest.weight, unit)} on ${formatShortDate(latest.date)}.`
    : `Weight from ${formatWeight(points[0].weight, unit)} on ${formatShortDate(first)} to ${formatWeight(latest.weight, unit)} on ${formatShortDate(last)}`
      + (goalWeight > 0 ? `, goal ${formatWeight(goalWeight, unit)}.` : '.')

  return (
    <figure className="weight-chart">
      <div className="weight-chart-plot">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary} preserveAspectRatio="none">
          {startWeight > 0 ? <line className="chart-reference" x1={0} x2={WIDTH} y1={y(startWeight)} y2={y(startWeight)} /> : null}
          {goalWeight > 0 ? <line className="chart-goal" x1={0} x2={WIDTH} y1={y(goalWeight)} y2={y(goalWeight)} /> : null}
          <path className="weight-line" d={line} />
          {points.map((point, index) => (
            <circle key={`${point.date}-${index}`} className={index === points.length - 1 ? 'weight-dot latest' : 'weight-dot'} cx={x(point.date)} cy={y(point.weight)} r={index === points.length - 1 ? 4.5 : 3} />
          ))}
        </svg>
        {/* Labels are HTML rather than SVG text so they are not stretched with the plot. */}
        {startWeight > 0 ? <span className="chart-label" style={{ top: `${(y(startWeight) / HEIGHT) * 100}%` }}>Start {formatWeight(startWeight, unit)}</span> : null}
        {goalWeight > 0 ? <span className="chart-label goal" style={{ top: `${(y(goalWeight) / HEIGHT) * 100}%` }}>Goal {formatWeight(goalWeight, unit)}</span> : null}
      </div>
      <div className="chart-axis" aria-hidden="true">
        <span>{formatShortDate(first)}</span>
        {points.length > 1 ? <span>{formatShortDate(last)}</span> : null}
      </div>
      <DataTable
        caption="Weigh-ins"
        columns={['Date', 'Weight', 'Change']}
        rows={[...points].reverse().map((point, index, newestFirst) => {
          const previous = newestFirst[index + 1]
          const change = previous ? point.weight - previous.weight : 0
          return [
            formatShortDate(point.date),
            formatWeight(point.weight, unit),
            previous ? (change === 0 ? 'No change' : `${change < 0 ? 'Down' : 'Up'} ${formatWeight(Math.abs(change), unit)}`) : 'First',
          ]
        })}
      />
    </figure>
  )
}
