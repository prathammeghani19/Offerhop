import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchCities, fetchAreas } from '../api/client'
import { useApp } from '../context/AppContext'

export default function AreaPickerScreen() {
  const { citySlug }       = useParams()
  const navigate           = useNavigate()
  const { setCity, setArea } = useApp()
  const [search, setSearch]  = useState('')

  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: fetchCities })
  const city = cities.find(c => c.slug === citySlug) || null

  const { data, isLoading } = useQuery({
    queryKey: ['areas', citySlug],
    queryFn: () => fetchAreas(citySlug),
    enabled: !!citySlug,
  })

  useEffect(() => { if (city) setCity(city) }, [city?.id])

  const areas = data?.areas || []
  const filtered = areas.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
  const grouped = filtered.reduce((acc, area) => {
    const z = area.zone || 'Other'
    if (!acc[z]) acc[z] = []
    acc[z].push(area)
    return acc
  }, {})

  const handleSelect = (area) => {
    setArea(area)
    navigate(`/${citySlug}/${area.slug}`)
  }

  const cityName = city?.name || citySlug

  return (
    <>
      <Helmet>
        <title>Food & Drink Deals in {cityName} – Areas & Neighbourhoods | OffferHop</title>
        <meta name="description" content={`Find the best restaurant deals, happy hours and dining offers in ${cityName}. Browse by area – Koramangala, Indiranagar, Connaught Place and more.`} />
        <meta property="og:title" content={`Food & Drink Deals in ${cityName} | OffferHop`} />
        <meta property="og:url" content={`https://offerhop.in/${citySlug}`} />
        <link rel="canonical" href={`https://offerhop.in/${citySlug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://offerhop.in" },
            { "@type": "ListItem", "position": 2, "name": cityName, "item": `https://offerhop.in/${citySlug}` },
          ]
        })}</script>
      </Helmet>

      <div>
        <div className="back-bar">
          <div className="container">
            <div className="back-bar-inner">
              <button className="back-btn" onClick={() => navigate('/')}>
                <svg viewBox="0 0 12 12" fill="none" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M8 2L4 6l4 4"/>
                </svg>
              </button>
              <div>
                <div className="back-bar-title">{cityName}</div>
                <div className="back-bar-sub">Select your area</div>
              </div>
            </div>
          </div>
        </div>

        <div className="container page-section">
          <div className="search-bar" style={{ marginBottom: 24 }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="#9A9A9A" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="5.5" cy="5.5" r="3.5"/><path d="M8.5 8.5 12 12"/>
            </svg>
            <input
              placeholder={`Search areas in ${cityName}…`}
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
                  <button
                    key={area.id}
                    className="area-item"
                    style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font)' }}
                    onClick={() => handleSelect(area)}
                  >
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
    </>
  )
}
