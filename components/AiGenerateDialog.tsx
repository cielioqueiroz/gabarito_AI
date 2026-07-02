'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  disciplinaNome: string
  topicos: string[]
  what: 'flashcards' | 'questoes' | 'resumo'
}

const COUNT = { flashcards: 6, questoes: 4, resumo: 1 }
const LABEL = { flashcards: 'flashcards', questoes: 'questões', resumo: 'resumo' }

export function AiGenerateDialog({ open, onClose, onConfirm, disciplinaNome, topicos, what }: Props) {
  const [busy, setBusy] = useState(false)

  async function handle() {
    setBusy(true)
    try { await onConfirm() } finally { setBusy(false); onClose() }
  }

  const preview = topicos.slice(0, 5)

  return (
    <Dialog open={open} onClose={onClose} title={`Gerar ${LABEL[what]} com IA`} description={`A Claude vai criar ${COUNT[what]} ${LABEL[what]} cobrindo os tópicos abaixo.`}>
      <div className="space-y-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Disciplina</p>
          <p className="text-sm text-foreground font-semibold">{disciplinaNome}</p>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Tópicos ({topicos.length})
          </p>
          {topicos.length === 0 ? (
            <p className="text-sm text-[#4A72E8]">⚠ Nenhum tópico cadastrado. A IA vai gerar com base no nome da disciplina.</p>
          ) : (
            <ul className="text-sm text-muted space-y-1">
              {preview.map((t, i) => <li key={i} className="truncate">• {t}</li>)}
              {topicos.length > 5 && (
                <li className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  + {topicos.length - 5} outros
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={handle} disabled={busy}>
            <Sparkles size={14} />
            {busy ? 'Gerando…' : `Gerar ${COUNT[what]} ${LABEL[what]}`}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
