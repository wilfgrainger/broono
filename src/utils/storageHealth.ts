import { useSyncExternalStore } from 'react'
import type { StateStorage } from 'zustand/middleware'

// Tracks whether the last attempt to save to device storage worked, so the UI
// can warn instead of silently keeping changes only in memory.
let saveFailed = false
const listeners = new Set<() => void>()

function setSaveFailed(next: boolean) {
  if (saveFailed === next) return
  saveFailed = next
  listeners.forEach((listener) => listener())
}

export function useStorageSaveFailed(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => saveFailed,
  )
}

/**
 * localStorage wrapped so a full disk, a disabled-storage browser setting or a
 * private window never throws inside a click handler.
 */
export const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name)
    } catch {
      setSaveFailed(true)
      return null
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value)
      setSaveFailed(false)
    } catch {
      setSaveFailed(true)
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name)
    } catch {
      // Nothing useful to do; the in-memory state is already reset.
    }
  },
}
