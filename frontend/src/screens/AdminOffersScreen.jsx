import { useState, useEffect, useCallback } from 'react'

const API = '/api'

const DEAL_COLORS = {
  BOGO:        { bg: 'rgba(45,201,138,0.12)', color: '#2DC98A' },
  COMBO:       { bg: 'rgba(96,165,250,0.12)', color: '#60A5FA' },
  PERCENT_OFF: { bg: 'rgba(251,191,36,0.12)', color: '#FBBf24' },
}

export default function AdminOffersScreen({ token, onInvalidToken }) {
  const [offers, setOffers]       = useState([])
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState(new Set())
  const [cities, setCities]       = useState([])
  const [areas, setAreas]         = useState([])
  const [categories, setCategories] = useState([])
  const [filterCity, setFilterCity]   = useState('')
  const [filterArea, setFilterArea]   = useState('')
  const [filterCat, setFilterCat]     = useState('')
  const [search, setSearch]           = useState('')
  const [total, setTotal]             = useState(0)
  const [confirm, setConfirm]         = useState(null) // { type: 'single'|'bulk', ids }
  const [deleting, setDeleting]       = useState(false)
  const [toast, setToast]             = useState('')

  useEffect(() => {
    fetch(`${API}/cities/`).then(r => r.json()).then(setCities)
    fetch(`${API}/categories/`).then(r => r.json()).then(setCategories)
  }, [])

  useEffect(() => {
    if (!filterCity) { setAreas([]); setFilterArea(''); return }
    fetch(`${API}/cities/${filterCity}/areas/`).then(r => r.json()).then(d => {
      setAreas(d.areas || [])
      setFilterArea('')
    })
  }, [filterCity])

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    const params = new URLSearchParams()
    if (filterCity) params.set('city', filterCity)
    if (filterArea) params.set('area', filterArea)
    if (filterCat)  params.set('category', filterCat)
    if (search)     params.set('q', search)
    try {
      const res = await fetch(`${API}/admin/offers/?${params}`, {
        headers: { 'X-Admin-Token': token },
      })
      if (res.status === 401) { onInvalidToken?.(); return }
      const data = await res.json()
      setOffers(data.offers || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [filterCity, filterArea, filterCat, search, token])

  useEffect(() => { fetchOffers() }, [fetchOffers])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const doDelete = async (ids) => {
    setDeleting(true)
    try {
      if (ids.length === 1) {
        const res = await fetch(`${API}/admin/offers/${ids[0]}/`, {
          method: 'DELETE', headers: { 'X-Admin-Token': token },
        })
        if (res.status === 401) { onInvalidToken?.(); return }
      } else {
        const res = await fetch(`${API}/admin/offers/bulk-delete/`, {
          method: 'POST',
          headers: { 'X-Admin-Token': token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
        if (res.status === 401) { onInvalidToken?.(); return }
      }
      showToast(`${ids.length} offer${ids.length > 1 ? 's' : ''} deleted`)
      await fetchOffers()
    } finally {
      setDeleting(false)
      setConfirm(null)
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allSelected = offers.length > 0 && selected.size === offers.length
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(offers.map(o => o.id)))

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>

      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
          Manage Offers
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
          Browse, filter and remove offers from the database.
        </p>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 10, marginBottom: 16 }}>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={selStyle}>
          <option value="">All cities</option>
          {cities.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={selStyle} disabled={!filterCity}>
          <option value="">All areas</option>
          {areas.map(a => <option key={a.slug} value={a.slug}>{a.name}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={selStyle}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
        </select>
        <input
          placeholder="Search restaurant name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...selStyle, color: search ? '#fff' : 'rgba(255,255,255,0.4)' }}
        />
      </div>

      {/* Stats + bulk actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, minHeight: 36 }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
          {loading ? 'Loading…' : `${offers.length} offers${total > offers.length ? ` (showing ${offers.length} of ${total})` : ''}`}
        </span>
        {selected.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#2DC98A', fontSize: 13, fontWeight: 600 }}>{selected.size} selected</span>
            <button
              onClick={() => setConfirm({ type: 'bulk', ids: [...selected] })}
              style={deleteBtnStyle}
            >
              Delete {selected.size} offer{selected.size > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 140px 100px 90px 36px', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '10px 16px', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: '#2DC98A', width: 15, height: 15, cursor: 'pointer' }} />
          </div>
          {['Restaurant & Deal', 'Area', 'Category', 'Type', ''].map((h, i) => (
            <div key={i} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={skel(15, 15, 8)} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={skel(160, 13)} />
                <div style={skel(100, 11)} />
              </div>
            </div>
          ))
        ) : offers.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📭</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No offers found</div>
          </div>
        ) : (
          offers.map((offer, idx) => {
            const isSelected = selected.has(offer.id)
            const dc = DEAL_COLORS[offer.deal_type] || DEAL_COLORS.COMBO
            return (
              <div
                key={offer.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 140px 100px 90px 36px',
                  gap: 0,
                  padding: '12px 16px',
                  borderBottom: idx < offers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  background: isSelected ? 'rgba(45,201,138,0.06)' : 'transparent',
                  transition: 'background 0.1s',
                  alignItems: 'center',
                }}
              >
                {/* Checkbox */}
                <div>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(offer.id)}
                    style={{ accentColor: '#2DC98A', width: 15, height: 15, cursor: 'pointer' }} />
                </div>

                {/* Restaurant + deal */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 18 }}>{offer.thumbnail_emoji}</span>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>
                      {offer.restaurant_name}
                    </span>
                    {offer.is_live && <span style={{ fontSize: 10, fontWeight: 700, color: '#2DC98A', background: 'rgba(45,201,138,0.12)', padding: '1px 6px', borderRadius: 99 }}>LIVE</span>}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>
                    {offer.deal_description}
                  </div>
                </div>

                {/* Area */}
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                  <div style={{ fontWeight: 600 }}>{offer.area_name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{offer.city_name}</div>
                </div>

                {/* Category */}
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{offer.category_name}</div>

                {/* Deal type badge */}
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: dc.bg, color: dc.color }}>
                    {offer.deal_type === 'PERCENT_OFF' ? '% Off' : offer.deal_type}
                  </span>
                </div>

                {/* Delete */}
                <div>
                  <button
                    onClick={() => setConfirm({ type: 'single', ids: [offer.id], name: offer.restaurant_name })}
                    style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#1E293B', borderRadius: 14, padding: '28px 28px 24px', maxWidth: 400, width: '100%', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginBottom: 8 }}>
              {confirm.type === 'single' ? 'Delete offer?' : `Delete ${confirm.ids.length} offers?`}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              {confirm.type === 'single'
                ? <><strong style={{ color: 'rgba(255,255,255,0.75)' }}>{confirm.name}</strong> will be permanently removed.</>
                : <>These <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{confirm.ids.length} offers</strong> will be permanently removed. This cannot be undone.</>
              }
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => doDelete(confirm.ids)} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: deleting ? 'rgba(239,68,68,0.4)' : '#EF4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#1E293B', border: '1px solid rgba(45,201,138,0.3)', borderRadius: 10, padding: '11px 20px', color: '#2DC98A', fontSize: 14, fontWeight: 600, zIndex: 1000, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

const selStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', outline: 'none', cursor: 'pointer',
}

const deleteBtnStyle = {
  padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
  background: 'rgba(239,68,68,0.15)', color: '#EF4444',
  border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
  transition: 'all 0.1s',
}

const skel = (w, h, br = 4) => ({
  width: w, height: h, borderRadius: br,
  background: 'rgba(255,255,255,0.07)',
  animation: 'shimmer 1.6s ease-in-out infinite',
  flexShrink: 0,
})
