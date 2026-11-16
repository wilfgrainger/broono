export type Tab = 'dashboard' | 'checkin' | 'progress' | 'guide' | 'journal' | 'profile'

export const TAB_TITLES: Record<Tab, string> = {
  dashboard: 'Home',
  checkin: 'Add a log',
  progress: 'Progress',
  guide: 'Guide',
  journal: 'Journal',
  profile: 'Settings',
}

// Each tab has a URL hash so the browser and Android back button move between
// tabs, and a reload keeps the user where they were. Home has no hash.
export const TAB_HASHES: Record<Tab, string> = {
  dashboard: '',
  checkin: '#log',
  progress: '#progress',
  guide: '#guide',
  journal: '#journal',
  profile: '#settings',
}

export function tabFromHash(hash: string): Tab {
  if (hash === '#updates') return 'guide'
  const match = (Object.keys(TAB_HASHES) as Tab[]).find((tab) => TAB_HASHES[tab] === hash && hash !== '')
  return match ?? 'dashboard'
}
