import { useApp } from '../context/AppContext'

/*
 * The "O" in OfferHop — a circle containing a % sign.
 * Proportions taken directly from the brand identity SVG (Artboard 1).
 * No background rect: the dark navbar provides the dark bg.
 */
function OfferHopMark({ size = 40, dark = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {dark && <rect width="32" height="32" rx="7" fill="#0B1F3A"/>}
      {/* cream circle — the O */}
      <circle cx="16" cy="16" r="14" fill="none" stroke="#F9F5EE" strokeWidth="2.5"/>
      {/* % slash */}
      <line x1="19.5" y1="10.5" x2="12.5" y2="21.5" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round"/>
      {/* % top dot */}
      <circle cx="12.5" cy="10.5" r="2.4" fill="#FDE68A"/>
      {/* % bottom dot */}
      <circle cx="19.5" cy="21.5" r="2.4" fill="#FDE68A"/>
    </svg>
  )
}

export { OfferHopMark }

export default function Navbar({ onLogoClick }) {
  const { activeTab, setActiveTab, city, area, category } = useApp()

  const locationLabel = city
    ? area
      ? `${city.name} · ${area.name}`
      : city.name
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
          <button
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <svg viewBox="0 0 20 20" fill="none"
              stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>
              <path d="M7 18v-5h6v5"/>
            </svg>
            Home
          </button>

          <button
            className={`nav-link ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <svg viewBox="0 0 20 20" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="8.5" cy="8.5" r="5"/>
              <path d="M13 13 17 17"/>
            </svg>
            Search
          </button>

          <button
            className={`nav-link ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <svg viewBox="0 0 20 20" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 17S3 12.5 3 7.5a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 5-7 9.5-7 9.5z"/>
            </svg>
            Saved
          </button>
        </nav>

        <div className="navbar-right">
          {locationLabel && (
            <button className="location-pill" onClick={() => setActiveTab('home')}>
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
