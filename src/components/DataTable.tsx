import { useId, type ReactNode } from 'react'

interface DataTableProps {
  caption: string
  columns: string[]
  rows: ReactNode[][]
  /** Text for the disclosure that reveals the table. */
  summary?: string
}

/**
 * The accessible text alternative for a chart: a real table with header
 * semantics inside a disclosure, in a keyboard-scrollable region.
 */
export default function DataTable({ caption, columns, rows, summary = 'Show the numbers' }: DataTableProps) {
  const captionId = useId()
  return (
    <details className="data-table-details">
      <summary>{summary}</summary>
      <div className="table-wrapper" role="region" aria-labelledby={captionId} tabIndex={0}>
        <table className="data-table">
          <caption id={captionId}>{caption}</caption>
          <thead>
            <tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => cellIndex === 0
                  ? <th key={cellIndex} scope="row">{cell}</th>
                  : <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
