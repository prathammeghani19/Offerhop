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

function AdminGate() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')
  const clearToken = () => { localStorage.removeItem('admin_token'); setToken('') }
  if (!token) return <AdminLoginScreen onLogin={(t) => setToken(t)} />
  return <AdminUploadScreen token={token} onLogout={clearToken} onInvalidToken={clearToken} />
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
