import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AppProvider } from './context/AppContext'
import { trackPage } from './analytics'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import CityPickerScreen from './screens/CityPickerScreen'
import AreaPickerScreen from './screens/AreaPickerScreen'
import DishPickerScreen from './screens/DishPickerScreen'
import OffersScreen from './screens/OffersScreen'
import SearchScreen from './screens/SearchScreen'
import SavedScreen from './screens/SavedScreen'
import AdminUploadScreen from './screens/AdminUploadScreen'
import AdminLoginScreen from './screens/AdminLoginScreen'
import AdminOffersScreen from './screens/AdminOffersScreen'

function AdminGate() {
  const [token, setToken]   = useState(localStorage.getItem('admin_token') || '')
  const [tab, setTab]       = useState('import')
  const clearToken = () => { localStorage.removeItem('admin_token'); setToken('') }
  if (!token) return <AdminLoginScreen onLogin={(t) => setToken(t)} />
  return (
    <div style={{ minHeight: '100vh', background: '#0F172A' }}>
      {/* Admin top bar */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>
              <span style={{ color: '#2DC98A' }}>offer</span>hop admin
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[{ id: 'import', label: '↑ Import CSV' }, { id: 'manage', label: '⚡ Manage Offers' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: tab === t.id ? 'rgba(45,201,138,0.15)' : 'transparent',
                  color: tab === t.id ? '#2DC98A' : 'rgba(255,255,255,0.45)',
                  border: tab === t.id ? '1px solid rgba(45,201,138,0.3)' : '1px solid transparent',
                  transition: 'all 0.12s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, padding: '5px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, textDecoration: 'none' }}>← App</a>
            <button onClick={clearToken} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, padding: '5px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, background: 'none', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
      </div>
      {tab === 'import'
        ? <AdminUploadScreen token={token} onLogout={clearToken} onInvalidToken={clearToken} hideHeader />
        : <AdminOffersScreen token={token} onInvalidToken={clearToken} />
      }
    </div>
  )
}

function PageTracker() {
  const { pathname } = useLocation()
  useEffect(() => { trackPage(pathname) }, [pathname])
  return null
}

function AppShell() {
  const navigate = useNavigate()
  return (
    <div className="app">
      <PageTracker />
      <Navbar onLogoClick={() => navigate('/')} />
      <main className="page-body">
        <Routes>
          <Route path="/"                                   element={<CityPickerScreen />} />
          <Route path="/search"                             element={<SearchScreen />} />
          <Route path="/saved"                              element={<SavedScreen />} />
          <Route path="/:citySlug"                          element={<AreaPickerScreen />} />
          <Route path="/:citySlug/:areaSlug"                element={<DishPickerScreen />} />
          <Route path="/:citySlug/:areaSlug/:categorySlug"  element={<OffersScreen />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  if (window.location.pathname.startsWith('/admin')) {
    return <HelmetProvider><AdminGate /></HelmetProvider>
  }
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
