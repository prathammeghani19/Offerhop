import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export const SCREENS = { CITY: 'city', AREA: 'area', DISH: 'dish', OFFERS: 'offers' }

export function AppProvider({ children }) {
  const [city, setCity] = useState(null)
  const [area, setArea] = useState(null)
  const [category, setCategory] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [screen, setScreen] = useState(SCREENS.CITY)

  const resetToHome = () => {
    setCity(null); setArea(null); setCategory(null)
    setScreen(SCREENS.CITY); setActiveTab('home')
  }

  return (
    <AppContext.Provider value={{
      city, setCity,
      area, setArea,
      category, setCategory,
      activeTab, setActiveTab,
      screen, setScreen,
      resetToHome,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
