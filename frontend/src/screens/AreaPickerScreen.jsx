import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAreas } from '../api/client'
import { useApp } from '../context/AppContext'

export default function AreaPickerScreen({ onBack, onAreaSelect }) {
  const { city, setArea } = useApp()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['areas', city?.slug],
    queryFn: () => fetchAreas(city.slug),
    enabled: !!city?.slug,
  })

  const areas = data?.areas || []
  const filtered = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )
  const grouped = filtered.reduce((acc, area) => {
    const z = area.zone || 'Other'
    if (!acc[z]) acc[z] = []
    acc[z].push(area)
    return acc
  }, {})

  const handleSelect = (area) => {
    setArea(area)
    onAreaSelect(area)
  }

  return (
    <div>
      {/* Back bar */}
      <div className="back-bar">
        <div className="container">
          <div className="back-bar-inner">
            <button className="back-btn" onClick={onBack}>
              <svg viewBox="0 0 12 12" fill="none" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round">
                <path d="M8 2L4 6l4 4"/>
              </svg>
            </button>
            <div>
              <div className="back-bar-title">{city?.name}</div>
              <div className="back-bar-sub">Select your area</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container page-section">
        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 24 }}>
          <svg viewBox="0 0 14 14" fill="none" stroke="#9A9A9A" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="5.5" cy="5.5" r="3.5"/><path d="M8.5 8.5 12 12"/>
          </svg>
          <input
            placeholder={`Search areas in ${city?.name || ''}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} style={{
              height: 48, borderRadius: 8, marginBottom: 2,
              background: 'var(--gray-light)',
              animation: 'shimmer 1.6s ease-in-out infinite',
            }} />
          ))
        ) : (
          Object.entries(grouped).map(([zone, zoneAreas]) => (
            <div key={zone}>
              <div className="zone-label">{zone}</div>
              {zoneAreas.map(area => (
                <button key={area.id} className="area-item" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font)' }} onClick={() => handleSelect(area)}>
                  <span className="area-item-name">{area.name}</span>
                  {area.deal_count > 0 && (
                    <span className="area-item-count">{area.deal_count} deals</span>
                  )}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#9A9A9A" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M3 2l4 3-4 3"/>
                  </svg>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
