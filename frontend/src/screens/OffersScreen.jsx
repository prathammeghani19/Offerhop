import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchOffers } from '../api/client'
import { useApp } from '../context/AppContext'
import OfferCard from '../components/OfferCard'
import OfferModal from '../components/OfferModal'
import SkeletonCard from '../components/SkeletonCard'

const FOOD_FILTERS   = ['All', 'BOGO', 'Combo', '% Off', 'Open Now']
const DRINKS_FILTERS = ['All', 'BOGO', '% Off', 'Happy Hours', 'Open Now']
const FILTER_MAP = {
  All: 'ALL', BOGO: 'BOGO', Combo: 'COMBO',
  '% Off': 'PERCENT_OFF', 'Happy Hours': 'ALL', 'Open Now': 'ALL',
}

const DRINK_SLUGS = ['beer', 'cocktails', 'mocktails', 'craft-beer', 'spirits']

export default function OffersScreen({ onBack, onBackToArea }) {
  const { city, area, category } = useApp()
  const [activeFilter, setActiveFilter] = useState('All')
  const [selectedOffer, setSelectedOffer] = useState(null)

  const isDrink = DRINK_SLUGS.includes(category?.slug)
  const FILTERS = isDrink ? DRINKS_FILTERS : FOOD_FILTERS

  useEffect(() => { setActiveFilter('All') }, [category?.slug])

  const dealType = FILTER_MAP[activeFilter] || 'ALL'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['offers', area?.slug, category?.slug, dealType],
    queryFn: () => fetchOffers({ areaSlug: area?.slug, categorySlug: category?.slug, dealType }),
    enabled: !!area?.slug,
  })

  const allOffers = data?.offers || []
  const offers = (() => {
    if (activeFilter === 'Open Now') return allOffers.filter(o => o.is_live)
    if (activeFilter === 'Happy Hours') return allOffers.filter(o =>
      o.is_live || /happy.?hour/i.test(o.valid_until || '') || /happy.?hour/i.test(o.deal_description || '')
    )
    return allOffers
  })()

  const title = category ? `${category.name} in ${area?.name}` : `Deals in ${area?.name}`

  return (
    <div>
      {/* Top bar */}
      <div className="offers-top-bar">
        <div className="container">
          <div className="offers-top-inner">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <button className="back-btn" onClick={onBack} style={{ marginTop: 3 }}>
                <svg viewBox="0 0 12 12" fill="none" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M8 2L4 6l4 4"/>
                </svg>
              </button>
              <div className="offers-title-block">
                <h1>{title}</h1>
                <div style={{ fontSize: 13, color: 'var(--gray-dark)' }}>
                  {isLoading
                    ? <em style={{ color: '#bbb' }}>Finding best offers…</em>
                    : `${offers.length} offer${offers.length !== 1 ? 's' : ''} · sorted by savings`}
                </div>
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="breadcrumb" style={{ marginTop: 10 }}>
            <span className="breadcrumb-item" onClick={onBackToArea}>Home</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item" onClick={onBackToArea}>{city?.name}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item" onClick={onBack}>{area?.name}</span>
            {category && (
              <>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">{category.name}</span>
              </>
            )}
          </div>

          {/* Filter chips */}
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

      {/* Offers grid */}
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
            <div className="empty-sub">Check your API keys or try again.</div>
          </div>
        )}

        {!isLoading && !isError && offers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No offers here yet</div>
            <div className="empty-sub">
              Still growing in {area?.name}.<br />
              Try a different dish or change your filter.
            </div>
            <button className="btn-primary" onClick={onBack}>Try another dish</button>
            <button className="btn-ghost" onClick={onBackToArea}>Change area</button>
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
  )
}
