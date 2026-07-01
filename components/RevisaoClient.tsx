'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import ShellLayout from './ShellLayout'
import FlashcardStudy from './FlashcardStudy'
import type { Flashcard } from '@/types'

interface Props {
  flashcards: Flashcard[]
  disciplinaMap: Record<string, string>
}

export default function RevisaoClient({ flashcards: initial, disciplinaMap }: Props) {
  const router = useRouter()
  const [cards, setCards] = useState(initial)
  const [done, setDone] = useState(false)

  const discNameOf = (card: Flashcard) => disciplinaMap[card.disciplina_id] ?? ''

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

  return (
    <ShellLayout title="Revisão do Dia">
      <div className="max-w-lg mx-auto px-6 py-8">
        <FlashcardStudy
          cards={cards}
          discNameOf={discNameOf}
          sessionKey="gab:revisao:index"
          onAnswer={(_orig, updated) => {
            setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
          }}
          onFinish={() => setDone(true)}
        />
      </div>
    </ShellLayout>
  )
}
