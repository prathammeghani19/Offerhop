import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCities } from '../api/client'
import { useApp } from '../context/AppContext'

export default function CityPickerScreen({ onCitySelect }) {
  const { setCity } = useApp()
  const [search, setSearch] = useState('')

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const greetEmoji = hour < 12 ? '☀️' : hour < 18 ? '👋' : '🌙'

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (city) => {
    setCity(city)
    onCitySelect(city)
  }

  return (
    <div>
      {/* Hero */}
      <div className="page-hero">
        <div className="container">
          <div className="page-eyebrow">Find deals near you</div>
          <div className="page-title">{greeting} {greetEmoji}</div>
          <div className="search-bar" style={{ maxWidth: 520 }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="#9A9A9A" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="5.5" cy="5.5" r="3.5"/><path d="M8.5 8.5 12 12"/>
            </svg>
            <input
              placeholder="Search cities, areas, venues…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* City grid */}
      <div className="container page-section">
        <div className="section-hdr">
          <h2>Choose your city</h2>
          <span>Top metros</span>
        </div>

        {isLoading ? (
          <div className="city-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: 110, borderRadius: 14,
                background: 'var(--gray-light)',
                animation: 'shimmer 1.6s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : (
          <div className="city-grid">
            {filtered.map(city => {
              const hasDeals = city.deal_count > 0
              return (
                <button
                  key={city.id}
                  className="city-card"
                  onClick={() => hasDeals && handleSelect(city)}
                  style={!hasDeals ? { opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                >
                  <div className="city-card-icon">{city.icon}</div>
                  {hasDeals
                    ? <div className="city-card-badge">{city.deal_count} deals</div>
                    : <div className="city-card-meta">Coming soon</div>
                  }
                  <div className="city-card-name">{city.name}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
