import { useEffect, useRef, useState } from 'react'
import { BookOpen, Home, Newspaper, Plus, TrendingDown, User } from 'lucide-react'
import { useStore } from './store'
import Dashboard from './pages/Dashboard'
import CheckIn from './pages/CheckIn'
import Progress from './pages/Progress'
import NewsPage from './pages/News'
import Journal from './pages/Journal'
import ProfilePage from './pages/Profile'
import Onboarding from './pages/Onboarding'
import Login from './pages/Login'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'

type Tab = 'dashboard' | 'checkin' | 'progress' | 'news' | 'journal' | 'profile'

const TAB_TITLES: Record<Tab, string> = {
  dashboard: 'Home',
  checkin: 'Weekly log',
  progress: 'Progress',
  news: 'Updates',
  journal: 'Journal',
  profile: 'Settings',
}

function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Broono`
  }, [title])
}

export default function App() {
  const hasStarted = useStore((state) => state.hasStarted)
  const hasCompletedOnboarding = useStore((state) => state.hasCompletedOnboarding)
  const { pathname } = window.location

  if (pathname === '/privacy') return <PrivacyPolicy />
  if (pathname === '/terms') return <Terms />

  // Old waitlist links now resolve to the local-first product landing page.
  if (!hasStarted || pathname === '/waitlist') return <Login />
  if (!hasCompletedOnboarding) return <Onboarding />

  return <AppShell />
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const resetDailyTotalsIfNewDay = useStore((state) => state.resetDailyTotalsIfNewDay)
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)

  useDocumentTitle(TAB_TITLES[activeTab])

  // Daily totals roll over when the app is opened or brought back to the foreground.
  useEffect(() => {
    resetDailyTotalsIfNewDay()
    const onVisible = () => {
      if (document.visibilityState === 'visible') resetDailyTotalsIfNewDay()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [resetDailyTotalsIfNewDay])

  // A tab change is a page change: start at the top and move focus to the new
  // content so keyboard and screen reader users are not left on the nav bar.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const main = mainRef.current
    if (!main) return
    main.scrollTop = 0
    main.focus({ preventScroll: true })
  }, [activeTab])

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />
      case 'checkin': return <CheckIn onDone={() => setActiveTab('dashboard')} />
      case 'progress': return <Progress />
      case 'news': return <NewsPage />
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
          onClick={() => setActiveTab('profile')}
          aria-label="Open settings"
          aria-current={activeTab === 'profile' ? 'page' : undefined}
        >
          <User size={19} color="#64748b" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      <main ref={mainRef} tabIndex={-1} className="app-main hide-scroll">
        {renderPage()}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <NavBtn icon={Home} label="Home" tab="dashboard" active={activeTab} onNav={setActiveTab} />
        <NavBtn icon={Plus} label="Log" tab="checkin" active={activeTab} onNav={setActiveTab} />
        <NavBtn icon={TrendingDown} label="Progress" tab="progress" active={activeTab} onNav={setActiveTab} />
        <NavBtn icon={Newspaper} label="Updates" tab="news" active={activeTab} onNav={setActiveTab} />
        <NavBtn icon={BookOpen} label="Journal" tab="journal" active={activeTab} onNav={setActiveTab} />
      </nav>
    </div>
  )
}

interface NavBtnProps {
  icon: React.ElementType
  label: string
  tab: Tab
  active: Tab
  onNav: (tab: Tab) => void
}

function NavBtn({ icon: Icon, label, tab, active, onNav }: NavBtnProps) {
  const isActive = tab === active

  return (
    <button
      type="button"
      className={`nav-btn ${isActive ? 'active' : ''}`}
      onClick={() => onNav(tab)}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="nav-icon-wrap">
        <Icon
          size={22}
          strokeWidth={1.5}
          color={isActive ? '#0f172a' : '#64748b'}
          aria-hidden="true"
        />
      </div>
      <span className="nav-label" aria-hidden="true">{label}</span>
    </button>
  )
}
