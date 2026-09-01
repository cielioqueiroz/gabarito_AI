'use client'

import { createContext, useContext, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // O tema já vem aplicado no <html> pelo themeInitScript de app/layout.tsx,
  // que roda antes da pintura para não piscar. Aqui só lemos o que ele decidiu.
  //
  // Havia um useEffect relendo o localStorage com `theme` na lista de
  // dependências: além de repetir o trabalho do script, ele chamava setState
  // dentro de um efeito que dependia do próprio estado — renderização em
  // cascata sem nenhum ganho.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'light'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  function toggle() {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('gabarito-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
