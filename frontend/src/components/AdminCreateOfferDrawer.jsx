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

const VALID_UNTIL_SUGGESTIONS = [
  'Daily, All day',
  'Weekdays only (Mon–Fri)',
  'Weekends only (Sat–Sun)',
  'Mon–Thu only',
  'Fri–Sun only',
  'Happy Hours: 12 PM – 4 PM',
  'Happy Hours: 4 PM – 7 PM',
  'Happy Hours: 5 PM – 8 PM',
  'Happy Hours: 7 PM – 10 PM',
  'Happy Hours: 12 PM – 7 PM',
  'Lunch only: 12 PM – 3 PM',
  'Dinner only: 7 PM – 11 PM',
  'Limited time offer',
]

const EMPTY = {
  city_slug: '',
  area_slug: '',
  category_slug: '',
  restaurant_name: '',
  deal_type: 'BOGO',
  deal_description: '',
  offer_detail: '',
  savings_amount: '',
  savings_percent: '',
  valid_until: '',
  rating: '',
  thumbnail_emoji: '🍽',
  source_url: '',
  is_live: true,
  is_pre_book: false,
  is_bank_offer: false,
}

export default function AdminCreateOfferDrawer({ token, onClose, onCreated }) {
  const [form, setForm]         = useState({ ...EMPTY })
  const [cities, setCities]     = useState([])
  const [areas, setAreas]       = useState([])
  const [categories, setCategories] = useState([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [errors, setErrors]     = useState({})
  const [toast, setToast]       = useState('')

  useEffect(() => {
    fetch(`${API}/cities/`).then(r => r.json()).then(setCities)
    fetch(`${API}/categories/`).then(r => r.json()).then(setCategories)
  }, [])

  useEffect(() => {
    if (!form.city_slug) { setAreas([]); set('area_slug', ''); return }
    setAreasLoading(true)
    fetch(`${API}/cities/${form.city_slug}/areas/`)
      .then(r => r.json())
      .then(d => { setAreas(d.areas || []); set('area_slug', '') })
      .finally(() => setAreasLoading(false))
  }, [form.city_slug])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const e = {}
    if (!form.city_slug)         e.city_slug = 'Required'
    if (!form.area_slug)         e.area_slug = 'Required'
    if (!form.category_slug)     e.category_slug = 'Required'
    if (!form.restaurant_name.trim()) e.restaurant_name = 'Required'
    if (!form.deal_type)         e.deal_type = 'Required'
    if (!form.deal_description.trim()) e.deal_description = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/admin/offers/`, {
        method: 'POST',
        headers: { 'X-Admin-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setToast('Offer created!')
        setTimeout(() => { onCreated?.(); onClose() }, 900)
      } else {
        const data = await res.json()
        setToast(data.error || 'Failed to create')
        setTimeout(() => setToast(''), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const err = (k) => errors[k] && (
    <span style={{ color: '#EF4444', fontSize: 11, marginTop: 3 }}>{errors[k]}</span>
  )

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, animation: 'fadeIn 0.15s ease' }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 500,
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
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>New Offer</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>Create a new offer manually</div>
          </div>
          <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Location section */}
            <SectionLabel>Location</SectionLabel>

            <Field label="City" error={err('city_slug')}>
              <select value={form.city_slug} onChange={e => set('city_slug', e.target.value)} style={inputStyle}>
                <option value="">— Select city —</option>
                {cities.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
              </select>
            </Field>

            <Field label="Area" error={err('area_slug')}>
              <select
                value={form.area_slug}
                onChange={e => set('area_slug', e.target.value)}
                style={{ ...inputStyle, opacity: !form.city_slug ? 0.45 : 1 }}
                disabled={!form.city_slug}
              >
                <option value="">{areasLoading ? 'Loading…' : form.city_slug ? '— Select area —' : '— Pick city first —'}</option>
                {areas.map(a => <option key={a.slug} value={a.slug}>{a.name}</option>)}
              </select>
            </Field>

            <Field label="Category" error={err('category_slug')}>
              <select
                value={form.category_slug}
                onChange={e => {
                  const slug = e.target.value
                  set('category_slug', slug)
                  if (EMOJIS_BY_CAT[slug]) set('thumbnail_emoji', EMOJIS_BY_CAT[slug])
                }}
                style={inputStyle}
              >
                <option value="">— Select category —</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
              </select>
            </Field>

            <Divider />

            {/* Offer details */}
            <SectionLabel>Offer Details</SectionLabel>

            <Field label="Restaurant Name" error={err('restaurant_name')}>
              <input
                value={form.restaurant_name}
                onChange={e => set('restaurant_name', e.target.value)}
                placeholder="e.g. Toit Brewpub"
                style={inputStyle}
              />
            </Field>

            <Field label="Deal Type" error={err('deal_type')}>
              <select value={form.deal_type} onChange={e => set('deal_type', e.target.value)} style={inputStyle}>
                {DEAL_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>

            <Field label="Deal Description" hint="Short punchy line shown on card (max 300)" error={err('deal_description')}>
              <input
                value={form.deal_description}
                onChange={e => set('deal_description', e.target.value)}
                placeholder="e.g. Buy 1 Get 1 Free on all draught beers"
                style={inputStyle}
                maxLength={300}
              />
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 3 }}>
                {form.deal_description.length}/300
              </span>
            </Field>

            <Field label="Full Offer Details" hint="Terms, timing, T&Cs">
              <textarea
                value={form.offer_detail}
                onChange={e => set('offer_detail', e.target.value)}
                rows={4}
                placeholder="Valid Mon–Thu 5–8 PM. Not valid on public holidays. Dine-in only."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </Field>

            <Divider />

            {/* Savings */}
            <SectionLabel>Savings</SectionLabel>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Savings Amount (₹)">
                <input type="number" value={form.savings_amount} onChange={e => set('savings_amount', e.target.value)}
                  placeholder="e.g. 299" style={inputStyle} />
              </Field>
              <Field label="Savings %">
                <input type="number" value={form.savings_percent} onChange={e => set('savings_percent', e.target.value)}
                  placeholder="e.g. 30" style={inputStyle} min={0} max={100} />
              </Field>
            </div>

            <Field label="Valid Until" hint="When / how long">
              <input
                list="valid-until-list"
                value={form.valid_until}
                onChange={e => set('valid_until', e.target.value)}
                placeholder="e.g. Happy Hours: 5 PM – 8 PM"
                style={inputStyle}
              />
              <datalist id="valid-until-list">
                {VALID_UNTIL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
              </datalist>
            </Field>

            <Divider />

            {/* Meta */}
            <SectionLabel>Meta</SectionLabel>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Rating (out of 5)">
                <input type="number" value={form.rating} onChange={e => set('rating', e.target.value)}
                  placeholder="e.g. 4.2" style={inputStyle} step={0.1} min={1} max={5} />
              </Field>
              <Field label="Emoji">
                <input value={form.thumbnail_emoji} onChange={e => set('thumbnail_emoji', e.target.value)}
                  style={{ ...inputStyle, fontSize: 22, textAlign: 'center' }} maxLength={4} />
              </Field>
            </div>

            <Field label="Source URL" hint="Zomato / EazyDiner / restaurant site">
              <input value={form.source_url} onChange={e => set('source_url', e.target.value)}
                placeholder="https://..." style={inputStyle} />
            </Field>

            <Divider />

            {/* Flags */}
            <SectionLabel>Flags</SectionLabel>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Toggle label="Live now" hint="Show LIVE badge on card" value={form.is_live} onChange={v => set('is_live', v)} />
              <Toggle label="Pre-book offer" hint="Requires advance table booking" value={form.is_pre_book} onChange={v => set('is_pre_book', v)} />
              <Toggle label="Bank / Card offer" hint="Requires specific bank card" value={form.is_bank_offer} onChange={v => set('is_bank_offer', v)} />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: saving ? 'rgba(45,201,138,0.5)' : toast === 'Offer created!' ? '#2DC98A' : '#2DC98A', color: '#0F172A', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}
          >
            {saving ? 'Creating…' : toast || '+ Create Offer'}
          </button>
        </div>
      </div>
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ color: '#2DC98A', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '2px 0' }} />
}

function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
        {hint && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>{hint}</span>}
      </div>
      {children}
      {error}
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
        style={{ width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', background: value ? '#2DC98A' : 'rgba(255,255,255,0.12)', position: 'relative', flexShrink: 0, transition: 'background 0.15s' }}
      >
        <span style={{ position: 'absolute', top: 3, left: value ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
      </button>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}
