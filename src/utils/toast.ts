import { useSyncExternalStore } from 'react'

export interface ToastMessage {
  id: number
  text: string
}

let toasts: ToastMessage[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

/** Shows a short, non-blocking confirmation such as "Log saved". */
export function showToast(text: string) {
  toasts = [...toasts.slice(-2), { id: nextId++, text }]
  emit()
}

export function dismissToast(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id)
  emit()
}

export function useToasts(): ToastMessage[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => toasts,
  )
}
