'use client'

import { createContext, useContext, useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'

const MotionCtx = createContext<{ reduce: boolean }>({ reduce: false })

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // useReducedMotion já reage a mudanças na preferência do sistema. Espelhar o
  // valor em estado com um efeito só adicionava um render a mais por mudança.
  const reduce = !!useReducedMotion()
  const valor = useMemo(() => ({ reduce }), [reduce])

  return <MotionCtx.Provider value={valor}>{children}</MotionCtx.Provider>
}

export function useMotion() {
  return useContext(MotionCtx)
}
