import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleSaved } from '../api/client'

function getFaviconUrl(sourceUrl) {
  if (!sourceUrl) return null
  try {
    const domain = new URL(sourceUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  } catch {
    return null
  }
}

export default function OfferModal({ offer, onClose }) {
  const [saved, setSaved] = useState(offer.is_saved)
  const [logoFailed, setLogoFailed] = useState(false)
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => toggleSaved(offer.id),
    onSuccess: (data) => {
      setSaved(data.saved)
      qc.invalidateQueries({ queryKey: ['saved'] })
    },
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const faviconUrl = getFaviconUrl(offer.source_url)
  const dealPrefix = { BOGO: 'BOGO', COMBO: 'Combo', PERCENT_OFF: '% Off' }[offer.deal_type] || 'Deal'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${offer.restaurant_name} ${offer.area_name} ${offer.city_name}`
  )}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <div className="modal-logo-wrap">
            <div className="modal-emoji">{offer.thumbnail_emoji || '🍽'}</div>
            {faviconUrl && !logoFailed && (
              <img
                className="modal-favicon"
                src={faviconUrl}
                alt=""
                onError={() => setLogoFailed(true)}
              />
            )}
          </div>
          <div className="modal-title-block">
            <h2 className="modal-name">{offer.restaurant_name}</h2>
            <a
              className="modal-loc"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 11, height: 14, flexShrink: 0 }}>
                <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.75A1.75 1.75 0 1 1 7 3.25a1.75 1.75 0 0 1 0 3.5z" fill="currentColor"/>
              </svg>
              {offer.area_name}, {offer.city_name}
            </a>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Deal badge */}
        <div className="modal-body">
          <div className="modal-deal-row">
            <span className="modal-deal-badge">{dealPrefix} · {offer.deal_description}</span>
            {offer.is_live && (
              <span className="live-tag">
                <span className="live-dot" />Live
              </span>
            )}
          </div>

          {/* Savings highlight */}
          {(offer.savings_amount || offer.savings_percent) && (
            <div className="modal-saving">
              {offer.savings_amount
                ? `Save ₹${Number(offer.savings_amount).toLocaleString('en-IN')}`
                : `Save ${offer.savings_percent}%`}
            </div>
          )}

          {/* Rating */}
          {offer.rating && (
            <div className="modal-rating">
              ⭐ {offer.rating}
              {offer.review_count ? ` · ${offer.review_count.toLocaleString()} reviews` : ''}
            </div>
          )}

          {/* Valid until */}
          {offer.valid_until && (
            <div className="modal-valid">
              🕐 {offer.valid_until}
            </div>
          )}

          {/* Full offer details */}
          {offer.offer_detail && (
            <div className="modal-detail-section">
              <div className="modal-detail-label">Offer Details</div>
              <div className="modal-detail-text">{offer.offer_detail}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            className={`modal-save-btn ${saved ? 'saved' : ''}`}
            onClick={() => mutation.mutate()}
          >
            {saved ? '♥ Saved' : '♡ Save Deal'}
          </button>
          {offer.source_url
            ? (
              <a
                href={offer.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-view-btn"
              >
                View Offer →
              </a>
            )
            : <span className="modal-view-btn muted">No link</span>
          }
        </div>
      </div>
    </div>
  )
}
