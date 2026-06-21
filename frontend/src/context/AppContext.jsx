import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [city, setCity]         = useState(null)
  const [area, setArea]         = useState(null)
  const [category, setCategory] = useState(null)

  const resetToHome = () => { setCity(null); setArea(null); setCategory(null) }

  return (
    <AppContext.Provider value={{ city, setCity, area, setArea, category, setCategory, resetToHome }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
