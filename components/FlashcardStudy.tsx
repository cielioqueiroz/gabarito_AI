'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Flashcard } from '@/types'
import { advanceBox } from '@/lib/leitner'
import { createClient } from '@/lib/supabase/client'
import { useMotion } from '@/lib/motion'

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
  sessionKey?: string
}

function readSession(key?: string): number {
  if (!key || typeof window === 'undefined') return 0
  const raw = sessionStorage.getItem(key)
  const n = raw ? parseInt(raw, 10) : 0
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function writeSession(key: string | undefined, index: number) {
  if (!key || typeof window === 'undefined') return
  sessionStorage.setItem(key, String(index))
}

function clearSession(key?: string) {
  if (!key || typeof window === 'undefined') return
  sessionStorage.removeItem(key)
}

export default function FlashcardStudy({ cards, discNameOf, onAnswer, onExit, onFinish, showBoxLabel = true, sessionKey }: Props) {
  const [index, setIndex] = useState(() => Math.min(readSession(sessionKey), Math.max(0, cards.length - 1)))
  const [flipped, setFlipped] = useState(false)
  const [history, setHistory] = useState<Flashcard[]>([])
  const [busy, setBusy] = useState(false)
  const { reduce } = useMotion()
  const current = cards[index]
  const progress = cards.length === 0 ? 0 : ((index + (flipped ? 0.5 : 0)) / cards.length) * 100

  useEffect(() => { writeSession(sessionKey, index) }, [index, sessionKey])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement | null
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return
      if (!current) return
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(v => !v) }
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
    if (index + 1 >= cards.length) { clearSession(sessionKey); onFinish?.() }
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
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        {onExit
          ? <button onClick={() => { clearSession(sessionKey); onExit() }} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-muted transition-colors cursor-pointer">← Sair</button>
          : <span />}
        <div className="flex-1 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {index + 1}/{cards.length}
          </span>
          <div className="flex-1 bg-elevated rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduce ? 0.1 : 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
        {history.length > 0 && (
          <button onClick={undo} disabled={busy} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-muted transition-colors cursor-pointer disabled:opacity-40" aria-label="Desfazer última resposta (U)">
            ↶ U
          </button>
        )}
      </div>

      {showBoxLabel && (
        <div className="flex justify-center">
          <Badge variant={BOX_VARIANT[current.box] ?? 'default'}>
            Caixa {current.box} — {BOX_LABEL[current.box]}
          </Badge>
        </div>
      )}

      {/* 3D flip card */}
      <div className="[perspective:1200px]">
        <motion.div
          key={current.id}
          className="relative min-h-56 cursor-pointer [transform-style:preserve-3d]"
          animate={reduce ? {} : { rotateY: flipped ? 180 : 0 }}
          transition={{ duration: reduce ? 0.05 : 0.5, ease: [0.34, 1.24, 0.64, 1] }}
          onClick={() => setFlipped(v => !v)}
          role="button"
          aria-pressed={flipped}
          aria-label={flipped ? 'Ver frente do card' : 'Ver verso do card'}
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setFlipped(v => !v))}
        >
          <CardFace side="front" text={current.frente} discNome={discNome} hint="Clique ou pressione espaço" />
          <CardFace side="back"  text={current.verso}  discNome={discNome} />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {flipped ? (
          <motion.div key="answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="destructive" size="lg" disabled={busy} onClick={() => handleAnswer(false)}>Revisar (1)</Button>
              <button
                onClick={() => handleAnswer(true)}
                disabled={busy}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 py-3 text-sm font-semibold hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Acertei (2)
              </button>
            </div>
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Próxima revisão em {days} dia{days === 1 ? '' : 's'} · U para desfazer · ? para ajuda
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

function CardFace({ side, text, discNome, hint }: { side: 'front' | 'back'; text: string; discNome: string; hint?: string }) {
  return (
    <div
      className={`absolute inset-0 bg-surface rounded-2xl border border-border flex flex-col items-center justify-center p-6 hover:border-[#3D4158] hover:shadow-xl hover:shadow-black/20 transition-colors select-none [backface-visibility:hidden]`}
      style={side === 'back' ? { transform: 'rotateY(180deg)' } : undefined}
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        {side === 'front' ? 'Frente' : 'Verso'} · {discNome}
      </p>
      <p className="text-foreground text-center text-base leading-relaxed">{text}</p>
      {hint && <p className="font-mono text-[10px] uppercase tracking-widest text-border mt-4">{hint}</p>}
    </div>
  )
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
