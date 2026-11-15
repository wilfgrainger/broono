export type ColorScheme = 'light dark' | 'light' | 'dark'

const STORAGE_KEY = 'color-scheme'

function meta(): HTMLMetaElement | null {
  return document.querySelector('meta[name="color-scheme"]')
}

/** The stored override, or 'light dark' (follow the system) when there is none. */
export function getColorScheme(): ColorScheme {
  const content = meta()?.content
  return content === 'light' || content === 'dark' ? content : 'light dark'
}

/**
 * Applies and remembers the theme. CSS maps the <meta> back to `color-scheme`,
 * so everything themed with tokens follows it. 'light dark' removes the
 * override and follows the system again.
 */
export function setColorScheme(scheme: ColorScheme) {
  const element = meta()
  if (element) element.content = scheme
  try {
    if (scheme === 'light dark') window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, scheme)
  } catch {
    // Storage blocked: the theme still applies for this visit.
  }
  window.dispatchEvent(new Event('broono:color-scheme'))
}

/** Keeps other open tabs in step when the theme changes in one of them. */
export function syncColorSchemeAcrossTabs() {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    const element = meta()
    if (element) element.content = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'light dark'
    window.dispatchEvent(new Event('broono:color-scheme'))
  })
}
