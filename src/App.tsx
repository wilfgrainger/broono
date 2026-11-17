import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Compass, Home, Plus, TrendingDown, User } from 'lucide-react'
import { flushSync } from 'react-dom'
import { useStore } from './store'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Progress from './pages/Progress'
import GuidePage from './pages/Guide'
import Journal from './pages/Journal'
import ProfilePage from './pages/Profile'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import Toaster from './components/Toaster'
import { useToday } from './utils/useToday'
import { useStorageSaveFailed } from './utils/storageHealth'
import { canUseDeviceReminders, syncDeviceReminder } from './utils/deviceReminder'
import { TAB_HASHES, TAB_TITLES, tabFromHash, type Tab } from './tabs'

function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Broono`
  }, [title])
}

export default function App() {
  const hasStarted = useStore((state) => state.hasStarted)
  const hasCompletedOnboarding = useStore((state) => state.hasCompletedOnboarding)
  // GitHub Pages serves /privacy/index.html as /privacy/, so ignore a trailing slash.
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'

  if (pathname === '/privacy') return <PrivacyPolicy />
  if (pathname === '/terms') return <Terms />

  // Old waitlist links now resolve to the local-first product landing page.
  if (!hasStarted || pathname === '/waitlist') return <Login />
  if (!hasCompletedOnboarding) return <Onboarding />

  return <AppShell />
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromHash(window.location.hash))
  const saveFailed = useStorageSaveFailed()
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const editLog = useStore((state) => (editingLogId ? state.logs.find((log) => log.id === editingLogId) : undefined))
  const reminderEnabled = useStore((state) => state.profile.deviceReminder)
  const reminderDay = useStore((state) => state.profile.injectionDayOfWeek)
  const reminderTime = useStore((state) => state.profile.reminderTime)
  const medicationName = useStore((state) => state.profile.medicationName)
  const doseMg = useStore((state) => state.profile.doseMg)

  // Keep the Android app's weekly notification in step with the settings.
  useEffect(() => {
    if (!canUseDeviceReminders()) return
    syncDeviceReminder({ enabled: reminderEnabled, dayOfWeek: reminderDay, time: reminderTime, medicationName, doseMg }).catch(() => {
      // Scheduling can fail if notifications are switched off; Settings explains how to turn them on.
    })
  }, [reminderEnabled, reminderDay, reminderTime, medicationName, doseMg])
  const resetDailyTotalsIfNewDay = useStore((state) => state.resetDailyTotalsIfNewDay)
  const mainRef = useRef<HTMLElement>(null)
  const previousTab = useRef<Tab>(activeTab)
  const today = useToday()

  useDocumentTitle(TAB_TITLES[activeTab])

  // Daily totals roll over at local midnight and when the app is reopened.
  useEffect(() => {
    resetDailyTotalsIfNewDay()
  }, [today, resetDailyTotalsIfNewDay])

  // A tab change is a page change: start at the top and move focus to the new
  // page heading so screen reader users hear where they are. Comparing with the
  // previous tab (rather than a first-render flag) keeps the initial load, and
  // StrictMode's repeated effects, from stealing focus.
  useEffect(() => {
    if (previousTab.current === activeTab) return
    previousTab.current = activeTab

    const main = mainRef.current
    if (!main) return
    main.scrollTop = 0
    const heading = main.querySelector<HTMLElement>('h1')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }, [activeTab])

  // History is updated here, outside the state updater, because React may run
  // updaters twice and that would push duplicate entries.
  const activeTabRef = useRef(activeTab)
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])
  // Cross-fades between tabs where the View Transitions API exists; elsewhere
  // the tab simply changes. flushSync makes React update the DOM inside the
  // transition callback so the browser captures the new state.
  const showTab = useCallback((tab: Tab) => {
    const update = () => {
      activeTabRef.current = tab
      setActiveTab(tab)
    }
    if (typeof document.startViewTransition !== 'function') {
      update()
      return
    }
    document.startViewTransition(() => flushSync(update))
  }, [])

  const navigate = useCallback((tab: Tab, options: { replace?: boolean } = {}) => {
    if (activeTabRef.current === tab) return
    const url = `${window.location.pathname}${window.location.search}${TAB_HASHES[tab]}`
    if (options.replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    showTab(tab)
  }, [showTab])

  // Back and forward buttons (including Android's) change the hash.
  useEffect(() => {
    const onPopState = () => {
      setEditingLogId(null)
      showTab(tabFromHash(window.location.hash))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [showTab])

  // After saving a log, Back should not reopen the finished form.
  const goHome = useCallback(() => navigate('dashboard', { replace: true }), [navigate])
  const finishEditing = useCallback(() => {
    setEditingLogId(null)
    navigate('progress', { replace: true })
  }, [navigate])
  const startEditing = useCallback((id: string) => {
    setEditingLogId(id)
    navigate('checkin')
  }, [navigate])
  // Choosing a tab yourself always starts a fresh log rather than resuming an edit.
  const chooseTab = useCallback((tab: Tab) => {
    setEditingLogId(null)
    navigate(tab)
  }, [navigate])

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard key={today} onNavigate={navigate} />
      case 'checkin': return <CheckIn key={editLog?.id ?? 'new'} editLog={editLog} onDone={editLog ? finishEditing : goHome} />
      case 'progress': return <Progress onEdit={startEditing} />
      case 'guide': return <GuidePage />
      case 'journal': return <Journal />
      case 'profile': return <ProfilePage />
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-wrap">
          <div className="logo-icon" aria-hidden="true">
            <span className="logo-b">b</span>
          </div>
          <span className="logo-text">
            broono<span className="logo-dot" aria-hidden="true">.</span>
          </span>
        </div>
        <button
          type="button"
          className="header-profile-btn"
          onClick={() => chooseTab('profile')}
          aria-label="Open settings"
          aria-current={activeTab === 'profile' ? 'page' : undefined}
        >
          <User size={19} color="currentColor" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      {saveFailed ? (
        <p role="alert" className="storage-warning">
          Changes could not be saved on this device (storage may be full or blocked). Export a backup from Settings now.
        </p>
      ) : null}

      <main ref={mainRef} className="app-main hide-scroll">
        {renderPage()}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <NavBtn icon={Home} label="Home" tab="dashboard" active={activeTab} onNav={chooseTab} />
        <NavBtn icon={Plus} label="Log" tab="checkin" active={activeTab} onNav={chooseTab} primary />
        <NavBtn icon={TrendingDown} label="Progress" tab="progress" active={activeTab} onNav={chooseTab} />
        <NavBtn icon={Compass} label="Guide" tab="guide" active={activeTab} onNav={chooseTab} />
        <NavBtn icon={BookOpen} label="Journal" tab="journal" active={activeTab} onNav={chooseTab} />
      </nav>

      <Toaster />
    </div>
  )
}

interface NavBtnProps {
  icon: React.ElementType
  label: string
  tab: Tab
  active: Tab
  onNav: (tab: Tab) => void
  /** The main action ("Log"), styled to stand out. */
  primary?: boolean
}

function NavBtn({ icon: Icon, label, tab, active, onNav, primary = false }: NavBtnProps) {
  const isActive = tab === active

  return (
    <button
      type="button"
      className={['nav-btn', isActive ? 'active' : '', primary ? 'primary' : ''].filter(Boolean).join(' ')}
      onClick={() => onNav(tab)}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="nav-icon-wrap">
        <Icon
          size={22}
          strokeWidth={isActive || primary ? 2.25 : 1.75}
          color="currentColor"
          aria-hidden="true"
        />
      </span>
      <span className="nav-label">{label}</span>
    </button>
  )
}
