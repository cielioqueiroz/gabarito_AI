'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const Ctx = createContext<{ open: boolean; toggle: () => void; show: () => void; hide: () => void }>({
  open: false, toggle: () => {}, show: () => {}, hide: () => {},
})

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return
      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setOpen(v => !v) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Ctx.Provider value={{ open, toggle: () => setOpen(v => !v), show: () => setOpen(true), hide: () => setOpen(false) }}>
      {children}
    </Ctx.Provider>
  )
}

export function useShortcuts() { return useContext(Ctx) }
