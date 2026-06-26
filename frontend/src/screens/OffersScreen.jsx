import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCities, fetchAreas, fetchCategories, fetchOffers } from '../api/client'
import { useApp } from '../context/AppContext'
import OfferCard from '../components/OfferCard'
import OfferModal from '../components/OfferModal'
import SkeletonCard from '../components/SkeletonCard'
import SeoHead from '../seo/SeoHead'

const FOOD_FILTERS   = ['All', 'BOGO', 'Combo', '% Off', 'Pre-book', 'Bank Offer', 'Open Now']
const DRINKS_FILTERS = ['All', 'BOGO', '% Off', 'Happy Hours', 'Pre-book', 'Bank Offer', 'Open Now']
const FILTER_MAP = {
  All: 'ALL', BOGO: 'BOGO', Combo: 'COMBO',
  '% Off': 'PERCENT_OFF', 'Happy Hours': 'ALL',
  'Pre-book': 'ALL', 'Bank Offer': 'ALL', 'Open Now': 'ALL',
}
const DRINK_SLUGS = ['beer', 'cocktails', 'mocktails', 'craft-beer', 'spirits']

const CAT_TITLE = {
  'beer': 'Beer Deals & Happy Hours', 'cocktails': 'Cocktail Offers & Happy Hours',
  'mocktails': 'Mocktail Deals', 'craft-beer': 'Craft Beer Deals & Happy Hours',
  'spirits': 'Spirits & Whisky Deals', 'biryani': 'Biryani Deals & Offers',
  'pizza': 'Pizza Deals & BOGO Offers', 'burger': 'Burger Deals & Combos',
  'burgers': 'Burger Deals & Combos', 'pasta': 'Pasta Deals', 'chinese': 'Chinese Food Deals',
  'desserts': 'Dessert Offers', 'sandwich': 'Sandwich Deals', 'bakery': 'Bakery Offers',
}

export default function OffersScreen() {
  const { citySlug, areaSlug, categorySlug } = useParams()
  const navigate                              = useNavigate()
  const { setCity, setArea, setCategory }     = useApp()
  const [activeFilter, setActiveFilter]       = useState('All')
  const [selectedOffer, setSelectedOffer]     = useState(null)

  const { data: cities = [] } = useQuery({ queryKey: ['cities'], queryFn: fetchCities })
  const city = cities.find(c => c.slug === citySlug) || null

  const { data: areasData } = useQuery({
    queryKey: ['areas', citySlug],
    queryFn: () => fetchAreas(citySlug),
    enabled: !!citySlug,
  })
  const area = areasData?.areas?.find(a => a.slug === areaSlug) || null

  const { data: catsData } = useQuery({
    queryKey: ['categories', areaSlug],
    queryFn: () => fetchCategories(areaSlug),
    enabled: !!areaSlug,
  })
  const category = catsData?.categories?.find(c => c.slug === categorySlug) || null

  useEffect(() => { if (city) setCity(city) },     [city?.id])
  useEffect(() => { if (area) setArea(area) },     [area?.id])
  useEffect(() => { if (category) setCategory(category) }, [category?.id])
  useEffect(() => { setActiveFilter('All') },       [categorySlug])

  const isDrink = DRINK_SLUGS.includes(categorySlug)
  const FILTERS = isDrink ? DRINKS_FILTERS : FOOD_FILTERS
  const dealType = FILTER_MAP[activeFilter] || 'ALL'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['offers', areaSlug, categorySlug, dealType],
    queryFn: () => fetchOffers({ areaSlug, categorySlug: categorySlug, dealType }),
    enabled: !!areaSlug,
  })

  const allOffers = data?.offers || []
  const offers = (() => {
    if (activeFilter === 'Open Now')   return allOffers.filter(o => o.is_live)
    if (activeFilter === 'Pre-book')   return allOffers.filter(o => o.is_pre_book)
    if (activeFilter === 'Bank Offer') return allOffers.filter(o => o.is_bank_offer)
    if (activeFilter === 'Happy Hours') return allOffers.filter(o =>
      o.is_live || /happy.?hour/i.test(o.valid_until || '') || /happy.?hour/i.test(o.deal_description || '')
    )
    return allOffers
  })()

  const cityName    = city?.name     || citySlug
  const areaName    = area?.name     || areaSlug
  const catName     = category?.name || categorySlug
  const catTitle    = CAT_TITLE[categorySlug] || `${catName} Deals`
  const pageTitle   = `${catTitle} in ${areaName}, ${cityName}`
  const metaDesc    = `Find the best ${catName.toLowerCase()} deals, BOGO offers and discounts in ${areaName}, ${cityName}. ${offers.length > 0 ? `${offers.length} live deals` : 'Save on your next meal or night out'} with OffferHop.`

  return (
    <>
      <SeoHead
        page="category"
        title={`${pageTitle} | OffferHop`}
        description={metaDesc}
        canonical={`https://offerhop.in/${citySlug}/${areaSlug}/${categorySlug}`}
        context={{ city, area, category, offers }}
      />

      <div>
        {/* Top bar */}
        <div className="offers-top-bar">
          <div className="container">
            <div className="offers-top-inner">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <button className="back-btn" onClick={() => navigate(`/${citySlug}/${areaSlug}`)} style={{ marginTop: 3 }}>
                  <svg viewBox="0 0 12 12" fill="none" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M8 2L4 6l4 4"/>
                  </svg>
                </button>
                <div className="offers-title-block">
                  <h1>{catName} in {areaName}</h1>
                  <div style={{ fontSize: 13, color: 'var(--gray-dark)' }}>
                    {isLoading
                      ? <em style={{ color: '#bbb' }}>Finding best offers…</em>
                      : `${offers.length} offer${offers.length !== 1 ? 's' : ''} · sorted by savings`}
                  </div>
                </div>
              </div>
            </div>

            <div className="breadcrumb" style={{ marginTop: 10 }}>
              <span className="breadcrumb-item" onClick={() => navigate('/')}>Home</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-item" onClick={() => navigate(`/${citySlug}`)}>{cityName}</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-item" onClick={() => navigate(`/${citySlug}/${areaSlug}`)}>{areaName}</span>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-current">{catName}</span>
            </div>

            <div className="filter-rail" style={{ paddingBottom: 0 }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`fchip ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 24 }}>
          {isLoading && (
            <div className="offers-grid">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {isError && (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <div className="empty-title">Couldn't load offers</div>
              <div className="empty-sub">Check your connection and try again.</div>
            </div>
          )}

          {!isLoading && !isError && offers.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No offers here yet</div>
              <div className="empty-sub">
                Still growing in {areaName}.<br />
                Try a different dish or change your filter.
              </div>
              <button className="btn-primary" onClick={() => navigate(`/${citySlug}/${areaSlug}`)}>Try another dish</button>
              <button className="btn-ghost" onClick={() => navigate(`/${citySlug}`)}>Change area</button>
            </div>
          )}

          {!isLoading && !isError && offers.length > 0 && (
            <div className="offers-grid">
              {offers.map(offer => (
                <OfferCard key={offer.id} offer={offer} onClick={() => setSelectedOffer(offer)} />
              ))}
            </div>
          )}
        </div>

        {selectedOffer && (
          <OfferModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />
        )}
      </div>
    </>
  )
}
