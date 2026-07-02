'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Keyboard } from 'lucide-react'
import Sidebar from './Sidebar'
import { useShortcuts } from '@/lib/shortcuts'
import { useMotion } from '@/lib/motion'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { PwaPrompt } from './PwaPrompt'

interface Props {
  children: React.ReactNode
  title?: string
  headerRight?: React.ReactNode
}

export default function ShellLayout({ children, title, headerRight }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const shortcuts = useShortcuts()
  const { reduce } = useMotion()
  const drawerRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!sidebarOpen) return
    const first = drawerRef.current?.querySelector<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])')
    first?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSidebarOpen(false); openerRef.current?.focus() }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])')
        if (focusables.length === 0) return
        const start = focusables[0]
        const end = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === start) { e.preventDefault(); end.focus() }
        else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); start.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-amber-600 focus:text-white focus:px-3 focus:py-1.5 focus:rounded-md focus:text-sm">
        Pular para o conteúdo
      </a>
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
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu principal"
              initial={reduce ? { opacity: 0 } : { x: -240 }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: -240 }}
              transition={reduce ? { duration: 0.1 } : { type: 'spring', stiffness: 300, damping: 30 }}
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
              ref={openerRef}
              className="md:hidden p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={sidebarOpen}
            >
              <Menu size={18} />
            </button>
            {title && (
              <h1 className="text-sm font-semibold text-foreground tracking-tight">{title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={shortcuts.show}
              aria-label="Ver atalhos de teclado"
              title="Atalhos (?)"
              className="hidden md:inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Keyboard size={16} />
            </button>
            {headerRight}
          </div>
        </header>
        <KeyboardShortcutsDialog open={shortcuts.open} onClose={shortcuts.hide} />

        {/* Content */}
        <motion.main
          id="main-content"
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.main>

        <PwaPrompt />

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
