import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function OfferHopMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="none" stroke="#F9F5EE" strokeWidth="2.5"/>
      <line x1="19.5" y1="10.5" x2="12.5" y2="21.5" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="12.5" cy="10.5" r="2.4" fill="#FDE68A"/>
      <circle cx="19.5" cy="21.5" r="2.4" fill="#FDE68A"/>
    </svg>
  )
}

export { OfferHopMark }

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
          <OfferHopMark size={40} />
          <span className="navbar-wordmark">
            <span className="wordmark-ffer">ffer</span>
            <span className="wordmark-hop">hop</span>
          </span>
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
                stroke="#F9F5EE" strokeWidth="1.8" strokeLinecap="round">
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
