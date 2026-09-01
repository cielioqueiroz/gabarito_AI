'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useSelectedLayoutSegment } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import { useMotion } from '@/lib/motion'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { PwaPrompt } from './PwaPrompt'
import { useShortcuts } from '@/lib/shortcuts'

const LARGURAS = {
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
} as const

type Largura = keyof typeof LARGURAS

/**
 * Largura da coluna por rota. Header, conteúdo e rodapé usam a MESMA, para que
 * título, ações e conteúdo fiquem na mesma coluna.
 *
 * Vem da rota, e não de uma prop da página, porque o rodapé mora aqui no shell:
 * ele precisa da largura sem que a página consiga passá-la para cima.
 * A chave é o segmento logo abaixo de `app/(app)` — `null` é a home.
 */
const LARGURA_POR_ROTA: Record<string, Largura> = {
  concursos:     '4xl',
  configuracoes: '2xl',
  revisao:       'lg',
}
const LARGURA_PADRAO: Largura = '3xl'

interface Shell {
  /** Classe da coluna, compartilhada por header, conteúdo e rodapé. */
  coluna: string
  menuAberto: boolean
  abrirMenu: () => void
  /** O foco volta para cá quando o drawer fecha no Esc. */
  botaoMenu: React.RefObject<HTMLButtonElement | null>
}

const ShellContext = createContext<Shell | null>(null)

export function useShell(): Shell {
  const shell = useContext(ShellContext)
  if (!shell) throw new Error('useShell() só funciona dentro de <AppShell>')
  return shell
}

/**
 * Casco da área logada. Vive em `app/(app)/layout.tsx`, então sidebar, drawer e
 * diálogos persistem entre navegações em vez de remontar a cada página.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const segmento = useSelectedLayoutSegment()
  const largura = (segmento && LARGURA_POR_ROTA[segmento]) || LARGURA_PADRAO
  const coluna = `w-full ${LARGURAS[largura]} mx-auto px-6`

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
    <ShellContext.Provider
      value={{ coluna, menuAberto: sidebarOpen, abrirMenu: () => setSidebarOpen(true), botaoMenu: openerRef }}
    >
      <div className="flex h-screen bg-background overflow-hidden">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-brand-solid focus:text-white focus:px-3 focus:py-1.5 focus:rounded-md focus:text-sm">
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
                className="absolute inset-0 bg-ink/65"
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
          <KeyboardShortcutsDialog open={shortcuts.open} onClose={shortcuts.hide} />

          {/* O header de cada página entra aqui dentro, via <Page>. */}
          <main id="main-content" className="flex-1 overflow-y-auto">
            {children}
          </main>

          <PwaPrompt />

          {/* Footer — vivo: hairline animada + pulso de status + crédito do autor */}
          <footer className={`${coluna} relative flex-shrink-0 h-10 flex items-center justify-between`}>
            <div aria-hidden className="divider-live absolute top-0 left-6 right-6" />
            <span className="font-mono text-[10px] font-bold tracking-tight text-muted">
              gabarito<span className="text-brand">_AI</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
              estudando com IA
            </span>
            <a
              href="https://cielioqueiroz.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="group font-mono text-[10px] tracking-tight text-muted-foreground transition-colors hover:text-foreground"
              title="Portfólio de Cielio Queiroz"
            >
              © {new Date().getFullYear()} <span className="font-bold text-brand group-hover:text-foreground transition-colors">Cielio Queiroz</span>
            </a>
          </footer>
        </div>
      </div>
    </ShellContext.Provider>
  )
}
