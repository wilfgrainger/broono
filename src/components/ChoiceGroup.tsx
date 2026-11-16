import { useId, type ReactNode } from 'react'

export interface Choice<T extends string> {
  value: T
  label: ReactNode
  /** Accessible name when `label` is not plain text (for example a short day name). */
  ariaLabel?: string
  hint?: ReactNode
}

interface BaseProps<T extends string> {
  legend: ReactNode
  /** Visually hide the legend when a visible heading already names the group. */
  hideLegend?: boolean
  description?: ReactNode
  options: Choice<T>[]
  name?: string
  layout?: 'grid' | 'wrap' | 'stack' | 'week'
  className?: string
}

interface RadioProps<T extends string> extends BaseProps<T> {
  multiple?: false
  value: T | ''
  onChange: (value: T) => void
}

interface CheckboxProps<T extends string> extends BaseProps<T> {
  multiple: true
  value: T[]
  onChange: (value: T[]) => void
}

/**
 * A group of choices built from native radio buttons (one answer) or
 * checkboxes (several answers) inside a fieldset, styled as tappable tiles.
 * Native inputs give arrow-key navigation, form semantics and screen reader
 * state without any ARIA.
 */
export default function ChoiceGroup<T extends string>(props: RadioProps<T> | CheckboxProps<T>) {
  const autoName = useId()
  const name = props.name ?? autoName
  const descriptionId = `${name}-description`
  const layout = props.layout ?? 'grid'

  return (
    <fieldset className={`choice-group ${props.className ?? ''}`} aria-describedby={props.description ? descriptionId : undefined}>
      <legend className={props.hideLegend ? 'visually-hidden' : 'choice-legend'}>{props.legend}</legend>
      {props.description ? <p id={descriptionId} className="choice-description">{props.description}</p> : null}
      <div className={`choice-options choice-${layout}`}>
        {props.options.map((option) => {
          const checked = props.multiple ? props.value.includes(option.value) : props.value === option.value
          return (
            <label key={option.value} className="choice">
              <input
                type={props.multiple ? 'checkbox' : 'radio'}
                name={name}
                value={option.value}
                checked={checked}
                aria-label={option.ariaLabel}
                onChange={(event) => {
                  if (props.multiple) {
                    props.onChange(event.target.checked
                      ? [...props.value, option.value]
                      : props.value.filter((value) => value !== option.value))
                  } else {
                    props.onChange(option.value)
                  }
                }}
              />
              <span className="choice-label">{option.label}</span>
              {option.hint ? <span className="choice-hint">{option.hint}</span> : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
