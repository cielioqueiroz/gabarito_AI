'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
  title?: string
  headerRight?: React.ReactNode
}

export default function ShellLayout({ children, title, headerRight }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 bottom-0 w-60 z-50"
            >
              <Sidebar onMobileClose={() => setSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b border-border bg-background/85 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu size={18} />
            </button>
            {title && (
              <h1 className="text-sm font-semibold text-foreground tracking-tight">{title}</h1>
            )}
          </div>
          {headerRight && (
            <div className="flex items-center gap-2">{headerRight}</div>
          )}
        </header>

        {/* Content */}
        <motion.main
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.main>

        {/* Footer */}
        <footer className="flex-shrink-0 h-9 flex items-center justify-center border-t border-border">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            gabarito_AI · concursos públicos
          </span>
        </footer>
      </div>
    </div>
  )
}
