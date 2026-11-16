import { useId, useState, type Ref } from 'react'
import { POUNDS_PER_STONE, getWeightInputUnitLabel, splitStones, type WeightUnit } from '../utils/weight'

interface WeightFieldProps {
    /** Visible label text; rendered as a <label> or, for stones and pounds, a <legend>. */
    label: string
    unit: WeightUnit
    /** Stored weight (kg or total pounds), or null while empty or incomplete. */
    value: number | null
    onChange: (value: number | null) => void
    error?: string
    size?: 'default' | 'display'
    /** Receives the first input so callers can focus it after failed validation. */
    inputRef?: Ref<HTMLInputElement>
    enterKeyHint?: 'next' | 'done'
}

const toDraft = (value: number | null) => (value === null ? '' : `${value}`)

/**
 * Weight entry in the user's unit. Kilograms and pounds use one field; stones
 * use a stones field and a pounds field, combined into total pounds.
 */
export default function WeightField({ label, unit, value, onChange, error, size = 'default', inputRef, enterKeyHint = 'done' }: WeightFieldProps) {
    const id = useId()
    const errorId = `${id}-error`
    const initial = value === null ? null : splitStones(value)

    // Drafts are strings so partial input ("12.") is never rewritten while typing.
    const [single, setSingle] = useState(toDraft(value))
    const [stones, setStones] = useState(initial ? `${initial.stones}` : '')
    const [pounds, setPounds] = useState(initial && initial.pounds > 0 ? `${initial.pounds}` : '')

    const describedBy = error ? errorId : undefined
    const className = size === 'display' ? 'weight-field weight-field-display' : 'weight-field'

    const errorMessage = error ? <p id={errorId} role="alert" className="field-error">{error}</p> : null

    if (unit !== 'st') {
        return (
            <div className={className}>
                <label htmlFor={id} className="weight-field-label">{label}</label>
                <div className="weight-field-row">
                    <input
                        ref={inputRef}
                        id={id}
                        name="weight"
                        type="number"
                        inputMode="decimal"
                        enterKeyHint={enterKeyHint}
                        required
                        min="1"
                        step="0.1"
                        placeholder="0.0"
                        className="weight-field-input"
                        value={single}
                        onChange={(event) => {
                            setSingle(event.target.value)
                            const parsed = Number.parseFloat(event.target.value)
                            onChange(Number.isFinite(parsed) ? parsed : null)
                        }}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={describedBy}
                    />
                    <span className="weight-field-unit" aria-hidden="true">{getWeightInputUnitLabel(unit)}</span>
                </div>
                {errorMessage}
            </div>
        )
    }

    const emitStones = (nextStones: string, nextPounds: string) => {
        const parsedStones = Number.parseFloat(nextStones)
        const parsedPounds = nextPounds === '' ? 0 : Number.parseFloat(nextPounds)
        const valid = Number.isFinite(parsedStones) && Number.isFinite(parsedPounds) && parsedStones >= 0 && parsedPounds >= 0
        onChange(valid ? parsedStones * POUNDS_PER_STONE + parsedPounds : null)
    }

    return (
        <fieldset className={className} aria-describedby={describedBy}>
            <legend className="weight-field-label">{label}</legend>
            <div className="weight-field-row">
                <input
                    ref={inputRef}
                    id={id}
                    name="weightStones"
                    type="number"
                    inputMode="numeric"
                    enterKeyHint="next"
                    required
                    min="0"
                    max="78"
                    step="1"
                    placeholder="0"
                    className="weight-field-input"
                    value={stones}
                    onChange={(event) => {
                        setStones(event.target.value)
                        emitStones(event.target.value, pounds)
                    }}
                    aria-label="Stones"
                    aria-invalid={error ? true : undefined}
                />
                <span className="weight-field-unit" aria-hidden="true">st</span>
                <input
                    name="weightPounds"
                    type="number"
                    inputMode="decimal"
                    enterKeyHint={enterKeyHint}
                    min="0"
                    max="13.9"
                    step="0.1"
                    placeholder="0"
                    className="weight-field-input"
                    value={pounds}
                    onChange={(event) => {
                        setPounds(event.target.value)
                        emitStones(stones, event.target.value)
                    }}
                    aria-label="Pounds"
                />
                <span className="weight-field-unit" aria-hidden="true">lbs</span>
            </div>
            {errorMessage}
        </fieldset>
    )
}
