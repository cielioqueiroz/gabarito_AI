'use client'

import { Dialog } from './ui/dialog'

interface Props { open: boolean; onClose: () => void }

const shortcuts: { section: string; items: { keys: string[]; label: string }[] }[] = [
  {
    section: 'Estudo de flashcards',
    items: [
      { keys: ['Espaço', 'Enter'],  label: 'Virar o card' },
      { keys: ['1', 'J'],           label: 'Marcar como errado' },
      { keys: ['2', 'K'],           label: 'Marcar como acertei' },
      { keys: ['U'],                label: 'Desfazer última resposta' },
    ],
  },
  {
    section: 'Global',
    items: [
      { keys: ['?'],   label: 'Abrir esta ajuda' },
      { keys: ['Esc'], label: 'Fechar diálogos' },
    ],
  },
]

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Atalhos de teclado" description="Estude mais rápido sem tirar as mãos do teclado.">
      <div className="space-y-5">
        {shortcuts.map(section => (
          <div key={section.section}>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{section.section}</h3>
            <ul className="space-y-1.5">
              {section.items.map(item => (
                <li key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{item.label}</span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((k, i) => (
                      <span key={k} className="flex items-center gap-1">
                        <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-elevated border border-border text-foreground">{k}</kbd>
                        {i < item.keys.length - 1 && <span className="text-[10px] text-muted-foreground">ou</span>}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
