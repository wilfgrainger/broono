import { useId, type ReactNode } from 'react'
import { Info } from 'lucide-react'

interface InfoPopoverProps {
  /** Accessible name for the trigger, e.g. "About this estimate". */
  label: string
  title: string
  children: ReactNode
}

/**
 * Secondary explanation behind a small "i" button: a native auto popover, so
 * it opens on click, tap or keyboard and closes with Esc or a tap outside,
 * without any script.
 */
export default function InfoPopover({ label, title, children }: InfoPopoverProps) {
  const id = useId()
  const titleId = `${id}-title`
  return (
    <>
      <button type="button" className="info-btn" aria-label={label} {...({ popovertarget: id } as Record<string, string>)}>
        <Info size={18} aria-hidden="true" />
      </button>
      <div id={id} className="info-popover" role="dialog" aria-labelledby={titleId} {...({ popover: 'auto' } as Record<string, string>)}>
        <h2 id={titleId}>{title}</h2>
        {children}
        <button type="button" className="btn-secondary popover-close" {...({ popovertarget: id, popovertargetaction: 'hide' } as Record<string, string>)}>
          Close
        </button>
      </div>
    </>
  )
}
