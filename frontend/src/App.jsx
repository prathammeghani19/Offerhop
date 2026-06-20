import { useState } from 'react'
import { AppProvider, useApp, SCREENS } from './context/AppContext'
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

function Main() {
  const { activeTab, screen, setScreen } = useApp()

  if (activeTab === 'search') return <SearchScreen />
  if (activeTab === 'saved') return <SavedScreen />

  switch (screen) {
    case SCREENS.CITY:
      return <CityPickerScreen onCitySelect={() => setScreen(SCREENS.AREA)} />
    case SCREENS.AREA:
      return <AreaPickerScreen onBack={() => setScreen(SCREENS.CITY)} onAreaSelect={() => setScreen(SCREENS.DISH)} />
    case SCREENS.DISH:
      return <DishPickerScreen onBack={() => setScreen(SCREENS.AREA)} onCategorySelect={() => setScreen(SCREENS.OFFERS)} />
    case SCREENS.OFFERS:
      return <OffersScreen onBack={() => setScreen(SCREENS.DISH)} onBackToArea={() => setScreen(SCREENS.AREA)} />
    default:
      return <CityPickerScreen onCitySelect={() => setScreen(SCREENS.AREA)} />
  }
}

function AppShell() {
  const { resetToHome } = useApp()
  return (
    <div className="app">
      <Navbar onLogoClick={resetToHome} />
      <main className="page-body">
        <Main />
      </main>
      <BottomNav />
    </div>
  )
}

function AdminGate() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '')

  const handleLogin = (t) => setToken(t)

  if (!token) return <AdminLoginScreen onLogin={handleLogin} />
  const clearToken = () => { localStorage.removeItem('admin_token'); setToken('') }
  return <AdminUploadScreen token={token} onLogout={clearToken} onInvalidToken={clearToken} />
}

export default function App() {
  if (window.location.pathname === '/admin') {
    return <AdminGate />
  }
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
