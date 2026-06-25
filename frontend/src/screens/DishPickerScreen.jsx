import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchCities, fetchAreas, fetchCategories } from '../api/client'
import { useApp } from '../context/AppContext'
import { track } from '../analytics'

export default function DishPickerScreen() {
  const { citySlug, areaSlug }         = useParams()
  const navigate                        = useNavigate()
  const { setCity, setArea, setCategory } = useApp()

  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: fetchCities })
  const city = cities.find(c => c.slug === citySlug) || null

  const { data: areasData } = useQuery({
    queryKey: ['areas', citySlug],
    queryFn: () => fetchAreas(citySlug),
    enabled: !!citySlug,
  })
  const area = areasData?.areas?.find(a => a.slug === areaSlug) || null

  const { data, isLoading } = useQuery({
    queryKey: ['categories', areaSlug],
    queryFn: () => fetchCategories(areaSlug),
    enabled: !!areaSlug,
  })

  useEffect(() => { if (city) setCity(city) }, [city?.id])
  useEffect(() => { if (area) setArea(area) }, [area?.id])

  const categories = data?.categories || []
  const food   = categories.filter(c => !c.is_drink)
  const drinks = categories.filter(c => c.is_drink)

  const handleSelect = (cat) => {
    setCategory(cat)
    track('category_selected', { category: cat.name, category_slug: cat.slug, area: areaName, city: cityName, is_drink: cat.is_drink })
    navigate(`/${citySlug}/${areaSlug}/${cat.slug}`)
  }

  const cityName = city?.name  || citySlug
  const areaName = area?.name  || areaSlug

  return (
    <>
      <Helmet>
        <title>Restaurant Deals in {areaName}, {cityName} | OffferHop</title>
        <meta name="description" content={`Best food and drink deals in ${areaName}, ${cityName}. Browse biryani, pizza, beer, cocktails, BOGO offers and happy hours at top restaurants.`} />
        <meta property="og:title" content={`Restaurant Deals in ${areaName}, ${cityName} | OffferHop`} />
        <meta property="og:url" content={`https://offerhop.in/${citySlug}/${areaSlug}`} />
        <link rel="canonical" href={`https://offerhop.in/${citySlug}/${areaSlug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://offerhop.in" },
            { "@type": "ListItem", "position": 2, "name": cityName, "item": `https://offerhop.in/${citySlug}` },
            { "@type": "ListItem", "position": 3, "name": areaName, "item": `https://offerhop.in/${citySlug}/${areaSlug}` },
          ]
        })}</script>
      </Helmet>

      <div>
        <div className="back-bar">
          <div className="container">
            <div className="back-bar-inner">
              <button className="back-btn" onClick={() => navigate(`/${citySlug}`)}>
                <svg viewBox="0 0 12 12" fill="none" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M8 2L4 6l4 4"/>
                </svg>
              </button>
              <div>
                <div className="back-bar-title">{areaName}</div>
                <div className="back-bar-sub">What's the craving?</div>
              </div>
            </div>

            <div className="breadcrumb" style={{ marginTop: 12 }}>
              <span className="breadcrumb-item" onClick={() => navigate('/')}>Home</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-item" onClick={() => navigate(`/${citySlug}`)}>{cityName}</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{areaName}</span>
            </div>
          </div>
        </div>

        <div className="container page-section">
          {isLoading ? (
            <>
              <div className="section-hdr"><h2>Popular dishes</h2></div>
              <div className="dish-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{ height: 110, borderRadius: 14, background: 'var(--gray-light)', animation: 'shimmer 1.6s ease-in-out infinite' }} />
                ))}
              </div>
            </>
          ) : (
            <>
              {food.length > 0 && (
                <>
                  <div className="section-hdr">
                    <h2>Food</h2>
                    <span>in {areaName}</span>
                  </div>
                  <div className="dish-grid" style={{ marginBottom: 36 }}>
                    {food.map(cat => (
                      <button key={cat.id} className="dish-tile" onClick={() => handleSelect(cat)}>
                        <div className="dish-tile-icon">{cat.icon}</div>
                        <div className="dish-tile-name">{cat.name}</div>
                        {cat.deal_count > 0 && <div className="dish-tile-count">{cat.deal_count} deals</div>}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {drinks.length > 0 && (
                <>
                  <div className="section-hdr">
                    <h2>Drinks</h2>
                    <span>Happy hours &amp; more</span>
                  </div>
                  <div className="dish-grid">
                    {drinks.map(cat => (
                      <button key={cat.id} className="dish-tile drink" onClick={() => handleSelect(cat)}>
                        <div className="dish-tile-icon">{cat.icon}</div>
                        <div className="dish-tile-name">{cat.name}</div>
                        {cat.deal_count > 0 && <div className="dish-tile-count">{cat.deal_count} deals</div>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
