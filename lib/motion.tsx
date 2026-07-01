'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'

const MotionCtx = createContext<{ reduce: boolean }>({ reduce: false })

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const systemReduce = useReducedMotion()
  const [reduce, setReduce] = useState<boolean>(!!systemReduce)

  useEffect(() => {
    setReduce(!!systemReduce)
  }, [systemReduce])

  return <MotionCtx.Provider value={{ reduce }}>{children}</MotionCtx.Provider>
}

export function useMotion() {
  return useContext(MotionCtx)
}
