import { useState, useEffect, useRef } from 'react'

const API = '/api'

export default function AdminUploadScreen({ token, onLogout }) {
  const [cities, setCities]         = useState([])
  const [areas, setAreas]           = useState([])
  const [categories, setCategories] = useState([])
  const [citySlug, setCitySlug]     = useState('')
  const [areaSlug, setAreaSlug]     = useState('')
  const [catSlug, setCatSlug]       = useState('')
  const [file, setFile]             = useState(null)
  const [dragging, setDragging]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState('')
  const fileRef = useRef()

  useEffect(() => {
    fetch(`${API}/cities/`).then(r => r.json()).then(d => setCities(d))
    fetch(`${API}/categories/`).then(r => r.json()).then(d => setCategories(d))
  }, [])

  useEffect(() => {
    if (!citySlug) { setAreas([]); setAreaSlug(''); return }
    fetch(`${API}/cities/${citySlug}/areas/`)
      .then(r => r.json())
      .then(d => { setAreas(d.areas || []); setAreaSlug('') })
  }, [citySlug])

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) setFile(f)
  }

  const handleSubmit = async () => {
    if (!file || !citySlug || !areaSlug || !catSlug) {
      setError('Please select city, area, category and a CSV file.'); return
    }
    setError(''); setLoading(true); setResult(null)

    const fd = new FormData()
    fd.append('csv_file', file)
    fd.append('city_slug', citySlug)
    fd.append('area_slug', areaSlug)
    fd.append('category_slug', catSlug)

    try {
      const res = await fetch(`${API}/admin/import-csv/`, {
        method: 'POST', body: fd,
        headers: { 'X-Admin-Token': token },
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Import failed'); return }
      setResult(data)
    } catch (e) {
      setError('Network error: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const cityName = cities.find(c => c.slug === citySlug)?.name || ''
  const areaName = areas.find(a => a.slug === areaSlug)?.name || ''
  const catName  = categories.find(c => c.slug === catSlug)?.name || ''

  return (
    <div style={{ minHeight: '100vh', background: '#0B1F3A', paddingTop: 80 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: '#F9F5EE', fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
              Import Deals
            </h1>
            <p style={{ color: 'rgba(249,245,238,0.5)', fontSize: 14, marginTop: 6 }}>
              Upload an Exa Webset CSV — Claude validates and structures the data automatically.
            </p>
          </div>
          <button onClick={onLogout} style={{
            color: 'rgba(249,245,238,0.4)', fontSize: 13, padding: '6px 12px',
            border: '1px solid rgba(249,245,238,0.15)', borderRadius: 8,
            cursor: 'pointer', background: 'none',
          }}>
            Logout
          </button>
        </div>

        {/* Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>City</label>
            <select value={citySlug} onChange={e => setCitySlug(e.target.value)} style={selectStyle}>
              <option value="">Select city</option>
              {cities.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Area</label>
            <select value={areaSlug} onChange={e => setAreaSlug(e.target.value)} style={selectStyle} disabled={!citySlug}>
              <option value="">Select area</option>
              {areas.map(a => <option key={a.slug} value={a.slug}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={catSlug} onChange={e => setCatSlug(e.target.value)} style={selectStyle}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#FDE68A' : 'rgba(249,245,238,0.2)'}`,
            borderRadius: 12,
            padding: '36px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: 20,
            background: dragging ? 'rgba(253,230,138,0.05)' : 'rgba(255,255,255,0.03)',
            transition: 'all 0.15s',
          }}
        >
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
            onChange={e => setFile(e.target.files[0])} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          {file
            ? <div style={{ color: '#FDE68A', fontSize: 15, fontWeight: 600 }}>{file.name}</div>
            : <div style={{ color: 'rgba(249,245,238,0.5)', fontSize: 14 }}>
                Drag & drop CSV here, or click to browse
              </div>
          }
        </div>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: 8, padding: '12px 16px', color: '#FCA5A5', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || !file || !citySlug || !areaSlug || !catSlug}
          style={{
            width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700,
            background: loading || !file || !citySlug || !areaSlug || !catSlug ? 'rgba(249,245,238,0.15)' : '#FDE68A',
            color: loading || !file || !citySlug || !areaSlug || !catSlug ? 'rgba(249,245,238,0.4)' : '#0B1F3A',
            cursor: loading || !file || !citySlug || !areaSlug || !catSlug ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {loading ? 'Claude is processing...' : 'Import via Claude'}
        </button>

        {/* Results */}
        {result && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Imported', value: result.imported, color: '#86EFAC' },
                { label: 'Skipped', value: result.skipped, color: '#FCA5A5' },
                { label: 'Total rows', value: result.total_rows, color: '#FDE68A' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)',
                  borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                  <div style={{ color: s.color, fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                  <div style={{ color: 'rgba(249,245,238,0.5)', fontSize: 12, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ color: '#F9F5EE', fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              {result.imported} offers added to {areaName}, {cityName} · {catName}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {result.offers.map(offer => (
                <div key={offer.id} style={{
                  background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                  padding: '16px', display: 'flex', gap: 14, alignItems: 'flex-start'
                }}>
                  <div style={{ fontSize: 28 }}>{offer.thumbnail_emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#F9F5EE', fontWeight: 700, fontSize: 15 }}>{offer.restaurant_name}</div>
                    <div style={{ color: '#FDE68A', fontSize: 13, marginTop: 3 }}>{offer.deal_description}</div>
                    {offer.valid_until && (
                      <div style={{ color: 'rgba(249,245,238,0.5)', fontSize: 12, marginTop: 3 }}>
                        {offer.valid_until}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={badgeStyle('#0B1F3A', '#FDE68A')}>{offer.deal_type}</span>
                      {offer.is_live && <span style={badgeStyle('#052e16', '#86EFAC')}>Live</span>}
                      {offer.savings_amount && <span style={badgeStyle('#1c1917', '#fdba74')}>₹{Number(offer.savings_amount).toLocaleString('en-IN')} saved</span>}
                      {offer.savings_percent && <span style={badgeStyle('#1c1917', '#fdba74')}>{offer.savings_percent}% off</span>}
                    </div>
                  </div>
                  {offer.source_url && (
                    <a href={offer.source_url} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'rgba(249,245,238,0.4)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', color: 'rgba(249,245,238,0.6)', fontSize: 12,
  fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
}

const selectStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(249,245,238,0.15)',
  color: '#F9F5EE', outline: 'none', cursor: 'pointer',
}

const badgeStyle = (bg, color) => ({
  background: bg, color, fontSize: 11, fontWeight: 700,
  padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}33`,
})
