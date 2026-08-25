'use client'

import { motion } from 'framer-motion'

/**
 * `template` em vez de `layout`: remonta a cada troca de segmento, então a
 * animação de entrada roda em toda navegação. Num layout ela rodaria uma vez só.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
