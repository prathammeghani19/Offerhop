import { useQuery } from '@tanstack/react-query'
import { fetchSaved } from '../api/client'
import { useApp } from '../context/AppContext'
import OfferCard from '../components/OfferCard'
import SkeletonCard from '../components/SkeletonCard'

export default function SavedScreen() {
  const { setActiveTab } = useApp()

  const { data: saved = [], isLoading } = useQuery({
    queryKey: ['saved'],
    queryFn: fetchSaved,
    refetchOnWindowFocus: true,
  })

  const count = saved.length

  return (
    <div>
      <div className="saved-header">
        <div className="container">
          <h1>Saved deals</h1>
          <p>
            {isLoading
              ? 'Loading your saves…'
              : count > 0
                ? `${count} deal${count !== 1 ? 's' : ''} saved · tap ♥ to unsave`
                : 'Your saved deals will appear here'}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {isLoading && (
          <div className="offers-grid">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!isLoading && saved.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <div className="empty-title">Nothing saved yet</div>
            <div className="empty-sub">
              Tap the ♡ on any deal to save it here for quick access later.
            </div>
            <button className="btn-primary" onClick={() => setActiveTab('home')}>
              Browse deals
            </button>
            <button className="btn-ghost" onClick={() => setActiveTab('search')}>
              Search deals
            </button>
          </div>
        )}

        {!isLoading && saved.length > 0 && (
          <div className="offers-grid">
            {saved.map(s => (
              <OfferCard key={s.id} offer={{ ...s.offer, is_saved: true }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
