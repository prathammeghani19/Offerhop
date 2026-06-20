import { useState } from 'react'
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

export default function OfferCard({ offer, onClick }) {
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

  const dealPrefix = { BOGO: '🍔 BOGO', COMBO: '🍱 Combo', PERCENT_OFF: '🏷' }[offer.deal_type] || '🏷'
  const faviconUrl = getFaviconUrl(offer.source_url)

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${offer.restaurant_name} ${offer.area_name} ${offer.city_name}`
  )}`

  return (
    <div className="offer-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="oc-top">
        <div className="oc-thumb">
          {faviconUrl && !logoFailed
            ? (
              <img
                src={faviconUrl}
                alt=""
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }}
                onError={() => setLogoFailed(true)}
              />
            )
            : offer.thumbnail_emoji || '🍽'
          }
        </div>
        <div className="oc-info">
          <div className="oc-info-row">
            <div className="oc-name">{offer.restaurant_name}</div>
            <button
              className={`oc-save ${saved ? 'saved' : ''}`}
              onClick={(e) => { e.stopPropagation(); mutation.mutate() }}
              title={saved ? 'Unsave' : 'Save deal'}
            >
              {saved ? '♥' : '♡'}
            </button>
          </div>
          <div className="oc-loc">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="oc-loc-link"
              onClick={(e) => e.stopPropagation()}
              title="Open in Google Maps"
            >
              <svg className="oc-map-pin" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 0C4.24 0 2 2.24 2 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.75A1.75 1.75 0 1 1 7 3.25a1.75 1.75 0 0 1 0 3.5z" fill="currentColor"/>
              </svg>
              {offer.area_name}{offer.distance_km ? ` · ${offer.distance_km} km` : ''}
            </a>
          </div>
          <div className="deal-badge-row">
            <span className="deal-badge">{dealPrefix} {offer.deal_description}</span>
            {offer.is_live && (
              <span className="live-tag">
                <span className="live-dot" />Live
              </span>
            )}
          </div>
          {offer.valid_until && <div className="oc-valid">{offer.valid_until}</div>}
          {offer.rating && (
            <div className="oc-rating">
              ⭐ {offer.rating}
              {offer.review_count ? ` · ${offer.review_count.toLocaleString()} reviews` : ''}
            </div>
          )}
        </div>
      </div>
      <div className="oc-bottom">
        <div className="oc-saving">
          {offer.savings_amount
            ? `You save ₹${Number(offer.savings_amount).toLocaleString('en-IN')}`
            : offer.savings_percent
              ? `You save ${offer.savings_percent}%`
              : 'Great deal'}
        </div>
        <span className="view-offer" onClick={(e) => { e.stopPropagation(); if (onClick) onClick() }}>
          View Details →
        </span>
      </div>
    </div>
  )
}
