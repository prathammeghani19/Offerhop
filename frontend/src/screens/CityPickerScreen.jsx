import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCities } from '../api/client'
import { useApp } from '../context/AppContext'
import { track } from '../analytics'
import SeoHead from '../seo/SeoHead'

export default function CityPickerScreen() {
  const { setCity } = useApp()
  const navigate    = useNavigate()
  const [search, setSearch] = useState('')

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
  })

  const filtered = cities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (city) => {
    setCity(city)
    track('city_selected', { city: city.name, city_slug: city.slug, deal_count: city.deal_count })
    navigate(`/${city.slug}`)
  }

  return (
    <>
      <SeoHead
        page="home"
        title="OffferHop – Best Food & Drink Deals in Bangalore, Delhi, Mumbai"
        description="Discover BOGO deals, happy hours, combo offers and dining discounts at top restaurants near you. Browse deals in Bangalore, Delhi, Mumbai, Pune, Hyderabad and more Indian cities."
        canonical="https://offerhop.in/"
      />

      <div>
        <div className="page-hero">
          <div className="container">
            <div className="page-eyebrow">Food & drink deals</div>
            <div className="page-title">Best deals in your city.</div>
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
    </>
  )
}
