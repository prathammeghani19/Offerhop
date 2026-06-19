import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '../api/client'
import { useApp } from '../context/AppContext'

export default function DishPickerScreen({ onBack, onCategorySelect }) {
  const { city, area, setCategory } = useApp()

  const { data, isLoading } = useQuery({
    queryKey: ['categories', area?.slug],
    queryFn: () => fetchCategories(area.slug),
    enabled: !!area?.slug,
  })

  const categories = data?.categories || []
  const food = categories.filter(c => !c.is_drink)
  const drinks = categories.filter(c => c.is_drink)

  const handleSelect = (cat) => {
    setCategory(cat)
    onCategorySelect(cat)
  }

  return (
    <div>
      <div className="back-bar">
        <div className="container">
          <div className="back-bar-inner">
            <button className="back-btn" onClick={onBack}>
              <svg viewBox="0 0 12 12" fill="none" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round">
                <path d="M8 2L4 6l4 4"/>
              </svg>
            </button>
            <div>
              <div className="back-bar-title">{area?.name}</div>
              <div className="back-bar-sub">What's the craving?</div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="breadcrumb" style={{ marginTop: 12 }}>
            <span className="breadcrumb-item" onClick={onBack}>Home</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item" onClick={onBack}>{city?.name}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{area?.name}</span>
          </div>
        </div>
      </div>

      <div className="container page-section">
        {isLoading ? (
          <>
            <div className="section-hdr"><h2>Popular dishes</h2></div>
            <div className="dish-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  height: 110, borderRadius: 14,
                  background: 'var(--gray-light)',
                  animation: 'shimmer 1.6s ease-in-out infinite',
                }} />
              ))}
            </div>
          </>
        ) : (
          <>
            {food.length > 0 && (
              <>
                <div className="section-hdr">
                  <h2>Food</h2>
                  <span>in {area?.name}</span>
                </div>
                <div className="dish-grid" style={{ marginBottom: 36 }}>
                  {food.map(cat => (
                    <button
                      key={cat.id}
                      className="dish-tile"
                      onClick={() => handleSelect(cat)}
                    >
                      <div className="dish-tile-icon">{cat.icon}</div>
                      <div className="dish-tile-name">{cat.name}</div>
                      {cat.deal_count > 0 && (
                        <div className="dish-tile-count">{cat.deal_count} deals</div>
                      )}
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
                    <button
                      key={cat.id}
                      className="dish-tile drink"
                      onClick={() => handleSelect(cat)}
                    >
                      <div className="dish-tile-icon">{cat.icon}</div>
                      <div className="dish-tile-name">{cat.name}</div>
                      {cat.deal_count > 0 && (
                        <div className="dish-tile-count">{cat.deal_count} deals</div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
