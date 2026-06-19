import { useApp } from '../context/AppContext'

export default function BottomNav() {
  const { activeTab, setActiveTab } = useApp()

  const items = [
    {
      id: 'home', label: 'Home',
      icon: (active) => (
        <svg viewBox="0 0 20 20" fill="none"
          stroke={active ? '#C2410C' : '#9A9A9A'}
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>
          <path d="M7 18v-5h6v5"/>
        </svg>
      ),
    },
    {
      id: 'search', label: 'Search',
      icon: (active) => (
        <svg viewBox="0 0 20 20" fill="none"
          stroke={active ? '#C2410C' : '#9A9A9A'}
          strokeWidth="1.7" strokeLinecap="round">
          <circle cx="8.5" cy="8.5" r="5"/>
          <path d="M13 13 17 17"/>
        </svg>
      ),
    },
    {
      id: 'saved', label: 'Saved',
      icon: (active) => (
        <svg viewBox="0 0 20 20" fill="none"
          stroke={active ? '#C2410C' : '#9A9A9A'}
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 17S3 12.5 3 7.5a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 5-7 9.5-7 9.5z"/>
        </svg>
      ),
    },
  ]

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map(item => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              className={`bnav-item ${active ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon(active)}
              <span className="bnav-label" style={active ? { color: '#C2410C' } : {}}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
