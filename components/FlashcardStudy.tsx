'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Flashcard } from '@/types'
import { advanceBox } from '@/lib/leitner'
import { createClient } from '@/lib/supabase/client'

type BoxVariant = 'destructive' | 'amber' | 'default' | 'emerald'
const BOX_VARIANT: Record<number, BoxVariant> = {
  1: 'destructive', 2: 'amber', 3: 'default', 4: 'emerald', 5: 'emerald',
}
const BOX_LABEL: Record<number, string> = {
  1: 'Aprendendo', 2: 'Revisando', 3: 'Fixando', 4: 'Dominando', 5: 'Dominado',
}

interface Props {
  cards: Flashcard[]
  discNameOf: (card: Flashcard) => string
  onAnswer: (card: Flashcard, updated: Flashcard) => void
  onExit?: () => void
  onFinish?: () => void
  showBoxLabel?: boolean
}

export default function FlashcardStudy({ cards, discNameOf, onAnswer, onExit, onFinish, showBoxLabel = true }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [history, setHistory] = useState<Flashcard[]>([])
  const [busy, setBusy] = useState(false)
  const current = cards[index]
  const reduce = useReducedMotion()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return
      if (e.key === ' ') { e.preventDefault(); setFlipped(v => !v) }
      if (flipped && (e.key === '1' || e.key.toLowerCase() === 'j')) handleAnswer(false)
      if (flipped && (e.key === '2' || e.key.toLowerCase() === 'k')) handleAnswer(true)
      if ((e.key === 'u' || e.key === 'U') && history.length > 0) undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  async function handleAnswer(acertou: boolean) {
    if (!current || busy) return
    setBusy(true)
    const { box, proxRevisao } = advanceBox(current.box, acertou)
    const updated: Flashcard = { ...current, box, prox_revisao: proxRevisao.toISOString() }
    setHistory(prev => [...prev, current])
    await createClient().from('flashcards').update({ box, prox_revisao: proxRevisao.toISOString() }).eq('id', current.id)
    onAnswer(current, updated)
    setFlipped(false)
    if (index + 1 >= cards.length) { onFinish?.() }
    else setIndex(i => i + 1)
    setBusy(false)
  }

  async function undo() {
    if (history.length === 0 || busy) return
    setBusy(true)
    const previous = history[history.length - 1]
    await createClient().from('flashcards').update({ box: previous.box, prox_revisao: previous.prox_revisao }).eq('id', previous.id)
    onAnswer(previous, previous)
    setHistory(prev => prev.slice(0, -1))
    setIndex(i => Math.max(0, i - 1))
    setFlipped(false)
    setBusy(false)
  }

  if (!current) return null
  const discNome = discNameOf(current)
  const days = daysUntil(current.prox_revisao)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {onExit
          ? <button onClick={onExit} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-muted transition-colors cursor-pointer">← Sair</button>
          : <span />}
        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button onClick={undo} disabled={busy} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-muted transition-colors cursor-pointer disabled:opacity-40" aria-label="Desfazer última resposta">
              ↶ Desfazer
            </button>
          )}
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {index + 1}/{cards.length}
          </span>
        </div>
      </div>

      {showBoxLabel && (
        <div className="flex justify-center">
          <Badge variant={BOX_VARIANT[current.box] ?? 'default'}>
            Caixa {current.box} — {BOX_LABEL[current.box]}
          </Badge>
        </div>
      )}

      <motion.div
        key={`${current.id}-${flipped ? 'back' : 'front'}`}
        initial={reduce ? { opacity: 0 } : { rotateY: -90, opacity: 0 }}
        animate={reduce ? { opacity: 1 } : { rotateY: 0, opacity: 1 }}
        transition={{ duration: reduce ? 0.1 : 0.25 }}
        className="bg-surface rounded-2xl border border-border min-h-48 cursor-pointer flex flex-col items-center justify-center p-6 hover:border-[#3D4158] hover:shadow-xl hover:shadow-black/20 transition-colors select-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setFlipped(v => !v)}
        role="button"
        aria-pressed={flipped}
        aria-label={flipped ? 'Ver frente do card' : 'Ver verso do card'}
        tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setFlipped(v => !v)}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          {flipped ? 'Verso' : 'Frente'} · {discNome}
        </p>
        <p className="text-foreground text-center text-base leading-relaxed">{flipped ? current.verso : current.frente}</p>
        {!flipped && <p className="font-mono text-[10px] uppercase tracking-widest text-border mt-4">Clique ou pressione espaço</p>}
      </motion.div>

      <AnimatePresence mode="wait">
        {flipped ? (
          <motion.div key="answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="destructive" size="lg" disabled={busy} onClick={() => handleAnswer(false)}>Revisar (1)</Button>
              <button
                onClick={() => handleAnswer(true)}
                disabled={busy}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 py-3 text-sm font-semibold hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Acertei (2)
              </button>
            </div>
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Próxima revisão em {days} dia{days === 1 ? '' : 's'} · U para desfazer
            </p>
          </motion.div>
        ) : (
          <motion.div key="reveal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Button className="w-full" size="lg" onClick={() => setFlipped(true)}>Revelar resposta (espaço)</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
