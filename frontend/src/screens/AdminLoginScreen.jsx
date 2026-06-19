import { useState } from 'react'

export default function AdminLoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/admin/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      localStorage.setItem('admin_token', data.token)
      onLogin(data.token)
    } catch (e) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0B1F3A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 16,
        padding: '40px 36px', width: '100%', maxWidth: 380,
        border: '1px solid rgba(249,245,238,0.1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="7" fill="#0B1F3A"/>
            <circle cx="16" cy="16" r="14" fill="none" stroke="#F9F5EE" strokeWidth="2.5"/>
            <line x1="19.5" y1="10.5" x2="12.5" y2="21.5" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round"/>
            <circle cx="12.5" cy="10.5" r="2.4" fill="#FDE68A"/>
            <circle cx="19.5" cy="21.5" r="2.4" fill="#FDE68A"/>
          </svg>
          <div style={{ color: '#F9F5EE', fontSize: 18, fontWeight: 800, marginTop: 12 }}>Admin</div>
          <div style={{ color: 'rgba(249,245,238,0.4)', fontSize: 13, marginTop: 4 }}>OffferHop Dashboard</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Username</label>
          <input
            type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder="pratham1906" autoComplete="username"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" autoComplete="current-password"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: 8, padding: '10px 14px', color: '#FCA5A5',
            fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || !username || !password} style={{
          width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700,
          background: loading || !username || !password ? 'rgba(253,230,138,0.3)' : '#FDE68A',
          color: '#0B1F3A', cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

const labelStyle = {
  display: 'block', color: 'rgba(249,245,238,0.6)', fontSize: 12,
  fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14,
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(249,245,238,0.15)',
  color: '#F9F5EE', outline: 'none', fontFamily: 'inherit',
}
