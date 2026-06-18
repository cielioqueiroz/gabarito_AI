'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { advanceBox } from '@/lib/leitner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ShellLayout from './ShellLayout'
import type { Flashcard } from '@/types'

interface Props {
  flashcards: Flashcard[]
  disciplinaMap: Record<string, string>
}

const BOX_VARIANT: Record<number, 'destructive'|'amber'|'default'|'emerald'> = {
  1: 'destructive', 2: 'amber', 3: 'default', 4: 'emerald', 5: 'emerald',
}

export default function RevisaoClient({ flashcards: initial, disciplinaMap }: Props) {
  const router = useRouter()
  const [cards, setCards] = useState(initial)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)

  const current = cards[index]

  async function handleAnswer(acertou: boolean) {
    if (!current) return
    const { box, proxRevisao } = advanceBox(current.box, acertou)
    setCards(prev => prev.map(c => c.id === current.id ? { ...c, box, prox_revisao: proxRevisao.toISOString() } : c))
    await createClient().from('flashcards').update({ box, prox_revisao: proxRevisao.toISOString() }).eq('id', current.id)
    setFlipped(false)
    if (index + 1 >= cards.length) setDone(true)
    else setIndex(i => i + 1)
  }

  if (cards.length === 0 || done) {
    return (
      <ShellLayout title="Revisão do Dia">
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/>
              </svg>
            </div>
            <h2 className="font-bold text-foreground text-xl mb-2">
              {done ? 'Sessão concluída!' : 'Nada para revisar hoje'}
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              {done
                ? `Você revisou ${cards.length} card${cards.length !== 1 ? 's' : ''} hoje. Continue assim!`
                : 'Todos os flashcards estão em dia. Volte amanhã!'}
            </p>
            <Button onClick={() => router.push('/')}>Voltar ao Dashboard</Button>
          </motion.div>
        </div>
      </ShellLayout>
    )
  }

  const discNome = disciplinaMap[current.disciplina_id] ?? ''
  const progress = ((index + 1) / cards.length) * 100

  return (
    <ShellLayout title="Revisão do Dia">
      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex-shrink-0">
            {index + 1}/{cards.length}
          </span>
          <div className="flex-1 bg-elevated rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <Badge variant={BOX_VARIANT[current.box] as any}>Caixa {current.box}</Badge>
        </div>

        {/* Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${current.id}-${flipped ? 'back' : 'front'}`}
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="bg-surface rounded-2xl border border-border min-h-56 cursor-pointer flex flex-col items-center justify-center p-8 hover:border-[#3D4158] hover:shadow-xl hover:shadow-black/20 transition-colors duration-200 select-none mb-6"
            onClick={() => setFlipped(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setFlipped(v => !v)}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
              {flipped ? 'Verso' : 'Frente'} · {discNome}
            </p>
            <p className="text-foreground text-center text-base leading-relaxed">{flipped ? current.verso : current.frente}</p>
            {!flipped && <p className="font-mono text-[10px] uppercase tracking-widest text-border mt-6">Clique para revelar</p>}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <AnimatePresence mode="wait">
          {flipped ? (
            <motion.div key="answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
              <Button variant="destructive" size="lg" onClick={() => handleAnswer(false)}>Revisar</Button>
              <button
                onClick={() => handleAnswer(true)}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 py-3 text-sm font-semibold hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-[0.98] transition-all duration-150 cursor-pointer"
              >
                Acertei
              </button>
            </motion.div>
          ) : (
            <motion.div key="reveal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Button className="w-full" size="lg" onClick={() => setFlipped(true)}>Revelar resposta</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ShellLayout>
  )
}
