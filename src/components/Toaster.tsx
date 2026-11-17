import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { dismissToast, useToasts, type ToastMessage } from '../utils/toast'

const DISMISS_AFTER_MS = 4500
const supportsPopover = typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover')

/**
 * One consistent, named place for confirmations. Each toast is a manual
 * popover (no light dismiss), closes itself after a few seconds unless it has
 * keyboard focus, and is announced to screen readers. Toasts only confirm
 * things the user can also see elsewhere, so missing one loses nothing.
 */
export default function Toaster() {
  const toasts = useToasts()
  const [announcement, setAnnouncement] = useState('')
  const latest = toasts.at(-1)

  // Announce after a short delay so it does not collide with the focus move
  // that usually happens at the same time (for example, returning to Home).
  useEffect(() => {
    if (!latest) return
    const timer = window.setTimeout(() => {
      const doc = document as Document & { ariaNotify?: (message: string) => void }
      if (typeof doc.ariaNotify === 'function') doc.ariaNotify(latest.text)
      else setAnnouncement(latest.text)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [latest])

  return (
    <div role="region" aria-label="Notifications" className="toast-region">
      {toasts.map((toast) => <Toast key={toast.id} toast={toast} />)}
      {/* Fallback live region for browsers without ariaNotify(). Always present so updates are announced. */}
      <p className="visually-hidden" aria-live="polite">{announcement}</p>
    </div>
  )
}

function Toast({ toast }: { toast: ToastMessage }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (supportsPopover) element.showPopover()

    let timer = window.setTimeout(close, DISMISS_AFTER_MS)
    // Keep the toast while the user is interacting with it.
    const pause = () => window.clearTimeout(timer)
    const resume = () => {
      if (!element.contains(document.activeElement)) timer = window.setTimeout(close, DISMISS_AFTER_MS)
    }
    function close() {
      if (element?.contains(document.activeElement)) return
      dismissToast(toast.id)
    }
    element.addEventListener('focusin', pause)
    element.addEventListener('focusout', resume)
    return () => {
      window.clearTimeout(timer)
      element.removeEventListener('focusin', pause)
      element.removeEventListener('focusout', resume)
    }
  }, [toast.id])

  return (
    <div
      ref={ref}
      className={supportsPopover ? 'toast' : 'toast is-open'}
      {...(supportsPopover ? { popover: 'manual' } : {})}
    >
      <span className="toast-message">{toast.text}</span>
      <button type="button" aria-label="Dismiss" onClick={() => dismissToast(toast.id)}>
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
