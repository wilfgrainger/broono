import { useEffect, useState } from 'react'
import { toLocalISODate } from './date'

/**
 * The current local date as `YYYY-MM-DD`. Re-renders at local midnight and when
 * the app returns to the foreground, so a tab left open does not show yesterday.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => toLocalISODate())

  useEffect(() => {
    let timer: number

    const sync = () => {
      setToday(toLocalISODate())
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
      window.clearTimeout(timer)
      timer = window.setTimeout(sync, nextMidnight.getTime() - now.getTime())
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync()
    }

    sync()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', sync)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', sync)
    }
  }, [])

  return today
}
