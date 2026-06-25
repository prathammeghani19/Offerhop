import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Navbar({ onLogoClick }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { city, area } = useApp()

  const activeTab = pathname === '/search' ? 'search'
                  : pathname === '/saved'  ? 'saved'
                  : 'home'

  const locationLabel = city
    ? area ? `${city.name} · ${area.name}` : city.name
    : null

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <button className="navbar-logo" onClick={onLogoClick}>
          <img src="/logo.png" alt="OffferHop" className="navbar-logo-img" />
        </button>

        <nav className="navbar-links">
          {[
            { id: 'home',   label: 'Home',   path: '/' },
            { id: 'search', label: 'Search', path: '/search' },
            { id: 'saved',  label: 'Saved',  path: '/saved' },
          ].map(({ id, label, path }) => (
            <button
              key={id}
              className={`nav-link ${activeTab === id ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="navbar-right">
          {locationLabel && (
            <button className="location-pill" onClick={() => navigate('/')}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="7" cy="6" r="2.5"/>
                <path d="M7 1C4.239 1 2 3.239 2 6c0 4.25 5 7 5 7s5-2.75 5-7c0-2.761-2.239-5-5-5z"/>
              </svg>
              {locationLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
