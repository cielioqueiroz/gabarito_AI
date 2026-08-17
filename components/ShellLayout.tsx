'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Keyboard } from 'lucide-react'
import Sidebar from './Sidebar'
import { useShortcuts } from '@/lib/shortcuts'
import { useMotion } from '@/lib/motion'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { PwaPrompt } from './PwaPrompt'

/**
 * Larguras de conteúdo. A página escolhe a sua; header, conteúdo e rodapé usam
 * a MESMA, para que título, ações e conteúdo fiquem na mesma coluna.
 */
const LARGURAS = {
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
} as const

interface Props {
  children: React.ReactNode
  title?: string
  headerRight?: React.ReactNode
  /** Largura da coluna de conteúdo. Padrão: 3xl. */
  largura?: keyof typeof LARGURAS
}

export default function ShellLayout({ children, title, headerRight, largura = '3xl' }: Props) {
  const container = `w-full ${LARGURAS[largura]} mx-auto px-6`
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-[#3556C4] focus:text-white focus:px-3 focus:py-1.5 focus:rounded-md focus:text-sm">
        Pular para o conteúdo
      </a>
      {/* Desktop sidebar — flutuante, com respiro das bordas */}
      <div className="hidden md:flex flex-col flex-shrink-0 p-3 pr-0">
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

      {/*
        Main area.
        O `md:pr-[15.75rem]` compensa a sidebar (w-60 = 15rem + 0.75rem do
        wrapper p-3). Sem ele, `mx-auto` centraliza dentro da área restante e o
        conteúdo fica 126px à direita do centro da tela — metade da sidebar,
        medido em 1920px. Com a compensação, os dois lados da coluna ficam
        iguais e o conteúdo cai no centro da VIEWPORT, que é o que se espera ao
        olhar para a tela. Em telas estreitas a coluna só encolhe: nunca passa
        por baixo da sidebar.
      */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:pr-[15.75rem]">
        {/* Header — sem borda dura: hairline viva no lugar */}
        <header className="h-14 flex-shrink-0 bg-background/85 backdrop-blur-sm sticky top-0 z-10">
          <div className={`${container} relative h-full flex items-center justify-between`}>
          <div aria-hidden className="divider-live absolute bottom-0 left-6 right-6" />
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
              className="hidden md:inline-flex p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A72E8]"
            >
              <Keyboard size={16} />
            </button>
            {headerRight}
          </div>
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
          {/* A coluna vive aqui, não em cada página: antes cada tela repetia o
              seu próprio `max-w-* mx-auto px-6` e elas divergiam entre si. */}
          <div className={`${container} py-8`}>{children}</div>
        </motion.main>

        <PwaPrompt />

        {/* Footer — vivo: hairline animada + pulso de status + crédito do autor */}
        <footer className={`${container} relative flex-shrink-0 h-10 flex items-center justify-between`}>
          <div aria-hidden className="divider-live absolute top-0 left-6 right-6" />
          <span className="font-mono text-[10px] font-bold tracking-tight text-muted">
            gabarito<span className="text-[#4A72E8]">_AI</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4A72E8] animate-pulse" />
            estudando com IA
          </span>
          <a
            href="https://cielioqueiroz.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="group font-mono text-[10px] tracking-tight text-muted-foreground transition-colors hover:text-foreground"
            title="Portfólio de Cielio Queiroz"
          >
            © {new Date().getFullYear()} <span className="font-bold text-[#A8BCF8] group-hover:text-[#F4F4F0] transition-colors">Cielio Queiroz</span>
          </a>
        </footer>
      </div>
    </div>
  )
}
