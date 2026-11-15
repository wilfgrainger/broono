import { useState } from 'react'
import { MEDICATION_INFO, type MedicationName } from '../utils/medications'

interface DoseInputProps {
  id: string
  label: string
  medication: MedicationName
  /** Dose in mg; 0 when not set. */
  value: number
  onChange: (value: number) => void
}

/**
 * Dose in mg: a number field (any dose, including compounded micro-doses) with
 * the medicine's standard pen strengths as one-tap picks.
 */
export default function DoseInput({ id, label, medication, value, onChange }: DoseInputProps) {
  const [draft, setDraft] = useState(value > 0 ? `${value}` : '')
  const hintId = `${id}-hint`
  const strengths = MEDICATION_INFO[medication].strengths

  const set = (next: number) => {
    setDraft(next > 0 ? `${next}` : '')
    onChange(next)
  }

  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{label}</label>
      <div className="weight-field-row">
        <input
          id={id}
          name="doseMg"
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          step="0.05"
          placeholder="e.g. 5"
          className="weight-field-input"
          value={draft}
          aria-describedby={hintId}
          onChange={(event) => {
            setDraft(event.target.value)
            const parsed = Number.parseFloat(event.target.value)
            onChange(Number.isFinite(parsed) && parsed > 0 && parsed <= 100 ? parsed : 0)
          }}
        />
        <span className="weight-field-unit" aria-hidden="true">mg</span>
      </div>
      <p id={hintId} style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Standard {medication} strengths:</p>
      <div className="dose-picks">
        {strengths.map((strength) => (
          <button
            key={strength}
            type="button"
            className="dose-pick"
            aria-pressed={value === strength}
            aria-label={`${strength} milligrams`}
            onClick={() => set(strength)}
          >
            {strength} mg
          </button>
        ))}
      </div>
    </div>
  )
}
