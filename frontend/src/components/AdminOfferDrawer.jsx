import { useState, useEffect } from 'react'

const API = '/api'

const EMOJIS_BY_CAT = {
  'beer': '🍺', 'cocktails': '🍹', 'mocktails': '🥤', 'craft-beer': '🍻',
  'spirits': '🥃', 'biryani': '🍛', 'pizza': '🍕', 'burger': '🍔',
  'sandwich': '🥪', 'wrap-rolls': '🌯', 'bakery': '🥐', 'desserts': '🍰',
  'healthy-meals': '🥗', 'tea-snacks': '🫖', 'chinese': '🥡', 'pasta': '🍝',
  'south-indian': '🥘', 'north-indian': '🍲', 'shakes': '🍦', 'sweets': '🧁',
}

const DEAL_TYPES = [
  { value: 'BOGO',        label: 'BOGO — Buy One Get One' },
  { value: 'COMBO',       label: 'Combo — Bundle / Set Meal' },
  { value: 'PERCENT_OFF', label: '% Off — Percentage Discount' },
]

export default function AdminOfferDrawer({ offerId, token, onClose, onSaved, onDeleted }) {
  const [offer, setOffer]       = useState(null)
  const [form, setForm]         = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [toast, setToast]       = useState('')
  const [dirty, setDirty]       = useState(false)

  useEffect(() => {
    fetch(`${API}/categories/`).then(r => r.json()).then(setCategories)
  }, [])

  useEffect(() => {
    if (!offerId) return
    setLoading(true)
    fetch(`${API}/admin/offers/${offerId}/`, { headers: { 'X-Admin-Token': token } })
      .then(r => r.json())
      .then(d => {
        setOffer(d)
        setForm({ ...d, category_slug: d.category_slug || '' })
        setLoading(false)
        setDirty(false)
      })
  }, [offerId])

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/admin/offers/${offerId}/`, {
        method: 'PATCH',
        headers: { 'X-Admin-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setToast('Saved ✓')
        setDirty(false)
        onSaved?.()
        setTimeout(() => setToast(''), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`${API}/admin/offers/${offerId}/`, {
        method: 'DELETE', headers: { 'X-Admin-Token': token },
      })
      onDeleted?.()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, animation: 'fadeIn 0.15s ease' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 480,
        background: '#0F172A',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 301,
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.22s cubic-bezier(.32,1,.6,1)',
        boxShadow: '-24px 0 60px rgba(0,0,0,0.4)',
      }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
          @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        `}</style>

        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
              {loading ? '—' : form?.restaurant_name}
            </div>
            {!loading && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{offer?.area_name}, {offer?.city_name} · {offer?.category_name}</div>}
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[200, 120, 280, 160].map((w, i) => (
                <div key={i} style={{ height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.07)', width: w, animation: 'shimmer 1.6s ease-in-out infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Restaurant name */}
              <Field label="Restaurant Name">
                <input value={form.restaurant_name} onChange={e => set('restaurant_name', e.target.value)} style={inputStyle} />
              </Field>

              {/* Category — move to another category */}
              <Field label="Category" hint="Move to a different category">
                <select
                  value={form.category_slug || ''}
                  onChange={e => {
                    const slug = e.target.value
                    const autoEmoji = EMOJIS_BY_CAT[slug]
                    set('category_slug', slug)
                    if (autoEmoji) set('thumbnail_emoji', autoEmoji)
                  }}
                  style={inputStyle}
                >
                  {categories.map(c => (
                    <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
                  ))}
                </select>
                {form.category_slug !== (offer?.category_slug || '') && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#FBBf24' }}>
                    Moving: <strong>{offer?.category_name}</strong> → <strong>{categories.find(c => c.slug === form.category_slug)?.name}</strong>
                  </div>
                )}
              </Field>

              {/* Deal type */}
              <Field label="Deal Type">
                <select value={form.deal_type} onChange={e => set('deal_type', e.target.value)} style={inputStyle}>
                  {DEAL_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </Field>

              {/* Deal description */}
              <Field label="Deal Description" hint="Short punchy line shown on card">
                <input value={form.deal_description} onChange={e => set('deal_description', e.target.value)} style={inputStyle} maxLength={300} />
              </Field>

              {/* Offer detail */}
              <Field label="Full Offer Details" hint="Terms, timing, T&Cs — shown in modal">
                <textarea
                  value={form.offer_detail || ''}
                  onChange={e => set('offer_detail', e.target.value)}
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </Field>

              {/* Savings row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Savings Amount (₹)">
                  <input type="number" value={form.savings_amount || ''} onChange={e => set('savings_amount', e.target.value)} style={inputStyle} placeholder="e.g. 299" />
                </Field>
                <Field label="Savings %">
                  <input type="number" value={form.savings_percent || ''} onChange={e => set('savings_percent', e.target.value)} style={inputStyle} placeholder="e.g. 30" min={0} max={100} />
                </Field>
              </div>

              {/* Valid until */}
              <Field label="Valid Until">
                <input value={form.valid_until || ''} onChange={e => set('valid_until', e.target.value)} style={inputStyle} placeholder="e.g. Daily till 7 PM" />
              </Field>

              {/* Rating + emoji row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Rating (out of 5)">
                  <input type="number" value={form.rating || ''} onChange={e => set('rating', e.target.value)} style={inputStyle} placeholder="e.g. 4.2" step={0.1} min={1} max={5} />
                </Field>
                <Field label="Emoji">
                  <input value={form.thumbnail_emoji || ''} onChange={e => set('thumbnail_emoji', e.target.value)} style={{ ...inputStyle, fontSize: 22, textAlign: 'center' }} maxLength={4} />
                </Field>
              </div>

              {/* Source URL */}
              <Field label="Source URL">
                <input value={form.source_url || ''} onChange={e => set('source_url', e.target.value)} style={inputStyle} placeholder="https://..." />
              </Field>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Toggle label="Live now" hint="Shows LIVE badge on card" value={form.is_live} onChange={v => set('is_live', v)} />
                <Toggle label="Pre-book offer" hint="Requires advance table booking" value={form.is_pre_book} onChange={v => set('is_pre_book', v)} />
                <Toggle label="Bank / Card offer" hint="Requires specific bank card" value={form.is_bank_offer} onChange={v => set('is_bank_offer', v)} />
              </div>

            </div>
          )}
        </div>

        {/* Footer actions */}
        {!loading && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, flexShrink: 0 }}>
            {!confirmDel ? (
              <>
                <button onClick={() => setConfirmDel(true)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  Delete
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: dirty ? '#2DC98A' : 'rgba(255,255,255,0.08)', color: dirty ? '#0F172A' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, cursor: dirty ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                >
                  {saving ? 'Saving…' : toast ? toast : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
        {hint && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ label, hint, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 1 }}>{hint}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: value ? '#2DC98A' : 'rgba(255,255,255,0.12)',
          position: 'relative', flexShrink: 0, transition: 'background 0.15s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.15s',
        }} />
      </button>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
