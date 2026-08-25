'use client'

import { Menu, Keyboard } from 'lucide-react'
import { useShortcuts } from '@/lib/shortcuts'
import { useShell } from './AppShell'

interface Props {
  children: React.ReactNode
  title?: string
  /** Ações à direita do título — ficam com a página porque carregam estado dela. */
  headerRight?: React.ReactNode
}

/**
 * Header + coluna de conteúdo de uma página da área logada. O casco (sidebar,
 * drawer, rodapé) vem do <AppShell>, que não remonta entre navegações.
 */
export default function Page({ children, title, headerRight }: Props) {
  const { coluna, menuAberto, abrirMenu, botaoMenu } = useShell()
  const shortcuts = useShortcuts()

  return (
    <>
      {/* Header — sem borda dura: hairline viva no lugar */}
      <header className="h-14 flex-shrink-0 bg-background/85 backdrop-blur-sm sticky top-0 z-10">
        <div className={`${coluna} relative h-full flex items-center justify-between`}>
          <div aria-hidden className="divider-live absolute bottom-0 left-6 right-6" />
          <div className="flex items-center gap-3">
            <button
              ref={botaoMenu}
              className="md:hidden p-1.5 rounded-lg text-muted hover:bg-elevated hover:text-foreground transition-colors cursor-pointer"
              onClick={abrirMenu}
              aria-label="Abrir menu"
              aria-expanded={menuAberto}
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

      {/* A coluna vive aqui, não em cada página: antes cada tela repetia o seu
          próprio `max-w-* mx-auto px-6` e elas divergiam entre si. */}
      <div className={`${coluna} py-8`}>{children}</div>
    </>
  )
}
