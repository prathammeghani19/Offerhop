import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchSearch, fetchSearchHistory } from '../api/client'
import OfferCard from '../components/OfferCard'
import SkeletonCard from '../components/SkeletonCard'

const SUGGESTIONS = [
  { label: '🍛 Biryani',    q: 'biryani' },
  { label: '🍕 BOGO Pizza', q: 'bogo pizza' },
  { label: '🍺 Craft Beer', q: 'craft beer' },
  { label: '🍔 Burgers',    q: 'burgers' },
  { label: '🍹 Cocktails',  q: 'cocktails' },
  { label: '🍝 Pasta',      q: 'pasta' },
  { label: '🌯 Rolls',      q: 'rolls' },
  { label: '🍱 Sushi',      q: 'sushi' },
]

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const inputRef = useRef(null)

  const { data: historyData } = useQuery({
    queryKey: ['search-history'],
    queryFn: fetchSearchHistory,
  })

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => fetchSearch(submitted),
    enabled: submitted.length > 1,
  })

  const handleSearch = (q) => {
    setQuery(q)
    setSubmitted(q)
  }

  const handleClear = () => {
    setQuery('')
    setSubmitted('')
    inputRef.current?.focus()
  }

  const offers = results?.results || []

  return (
    <>
      <Helmet>
        <title>Search Food & Drink Deals | OffferHop</title>
        <meta name="description" content="Search for BOGO deals, happy hours, combo offers and restaurant discounts near you. Find biryani, pizza, beer and more deals across Indian cities." />
        <link rel="canonical" href="https://offerhop.in/search" />
      </Helmet>

      <div>
      {/* Page header */}
      <div className="page-hero" style={{ paddingBottom: 20 }}>
        <div className="container">
          <div className="page-title" style={{ marginBottom: 16 }}>Search</div>
          <div className="search-page-bar" style={{ maxWidth: 640 }}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="5.5" cy="5.5" r="3.5"/><path d="M8.5 8.5 12 12"/>
            </svg>
            <input
              ref={inputRef}
              placeholder="Search restaurants, dishes, areas…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && query.trim() && handleSearch(query.trim())}
              autoFocus
            />
            {query && (
              <button className="cancel-btn" onClick={handleClear}>Clear</button>
            )}
          </div>
        </div>
      </div>

      <div className="container page-section">
        {/* Search results */}
        {submitted && (
          <>
            {isLoading && (
              <div className="offers-grid">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}
            {!isLoading && offers.length === 0 && (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-icon">🔍</div>
                <div className="empty-title">No results for "{submitted}"</div>
                <div className="empty-sub">Try a different keyword or browse by category.</div>
                <button className="btn-ghost" onClick={handleClear}>Clear search</button>
              </div>
            )}
            {!isLoading && offers.length > 0 && (
              <>
                <div className="results-meta" style={{ marginBottom: 16 }}>
                  <span className="results-count">{offers.length} result{offers.length !== 1 ? 's' : ''} for "{submitted}"</span>
                </div>
                <div className="offers-grid">
                  {offers.map(offer => <OfferCard key={offer.id} offer={offer} />)}
                </div>
              </>
            )}
          </>
        )}

        {/* Empty state — show history + suggestions */}
        {!submitted && (
          <div style={{ maxWidth: 700 }}>
            {historyData?.history?.length > 0 && (
              <>
                <div className="sub-label">Recent searches</div>
                {historyData.history.slice(0, 6).map((h, i) => (
                  <button
                    key={i}
                    className="recent-item"
                    style={{ width: '100%', background: 'none', border: 'none', borderBottom: '1px solid var(--gray-border)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font)', padding: '12px 0', display: 'flex', alignItems: 'center', gap: 12 }}
                    onClick={() => handleSearch(h.query)}
                  >
                    <div className="recent-icon">🕐</div>
                    <div style={{ flex: 1 }}>
                      <div className="recent-item-name">{h.query}</div>
                    </div>
                    <span style={{ fontSize: 16, color: 'var(--gray-border)' }}>↗</span>
                  </button>
                ))}
              </>
            )}

            <div className="sub-label" style={{ marginTop: 28 }}>Try searching for</div>
            <div className="sug-chip-row">
              {SUGGESTIONS.map(s => (
                <button key={s.q} className="sug-chip" onClick={() => handleSearch(s.q)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
