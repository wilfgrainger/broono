import { useEffect, useState } from 'react'
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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const resetWaterIfNewDay = useStore((state) => state.resetWaterIfNewDay)
  const hasStarted = useStore((state) => state.hasStarted)
  const hasCompletedOnboarding = useStore((state) => state.hasCompletedOnboarding)

  useEffect(() => {
    resetWaterIfNewDay()
  }, [resetWaterIfNewDay])

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

  if (window.location.pathname === '/privacy') {
    return <PrivacyPolicy />
  }

  if (window.location.pathname === '/terms') {
    return <Terms />
  }

  // Old waitlist links now resolve to the local-first product landing page.
  if (!hasStarted || window.location.pathname === '/waitlist') {
    return <Login />
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo-wrap">
          <div className="logo-icon">
            <span className="logo-b">b</span>
          </div>
          <span className="logo-text">
            broono<span className="logo-dot">.</span>
          </span>
        </div>
        <button
          className="header-profile-btn"
          onClick={() => setActiveTab('profile')}
          aria-label="Open settings"
        >
          <User size={19} color="#64748b" strokeWidth={1.5} />
        </button>
      </header>

      <main className="app-main hide-scroll">
        {renderPage()}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <NavBtn icon={Home} label="Home" tab="dashboard" active={activeTab} onNav={setActiveTab} />
        <NavBtn icon={Plus} label="Log" tab="checkin" active={activeTab} onNav={setActiveTab} />
        <NavBtn icon={TrendingDown} label="Progress" tab="progress" active={activeTab} onNav={setActiveTab} />
        <NavBtn icon={Newspaper} label="News" tab="news" active={activeTab} onNav={setActiveTab} />
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
      className={`nav-btn ${isActive ? 'active' : ''}`}
      onClick={() => onNav(tab)}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="nav-icon-wrap">
        <Icon
          size={22}
          strokeWidth={1.5}
          color={isActive ? '#0f172a' : '#94a3b8'}
        />
      </div>
      <span className="nav-label">{label}</span>
    </button>
  )
}
