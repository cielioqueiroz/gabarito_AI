'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { advanceBox, isDue } from '@/lib/leitner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import ProgressBar from './ProgressBar'
import type { Disciplina, Flashcard } from '@/types'

interface Props {
  disciplinas: Disciplina[]
  flashcards: Flashcard[]
  concursoId: string
}

type Mode = 'list' | 'study'

const BOX_LABEL: Record<number, string> = {
  1: 'Aprendendo', 2: 'Revisando', 3: 'Fixando', 4: 'Dominando', 5: 'Dominado',
}
const BOX_VARIANT: Record<number, 'destructive'|'amber'|'default'|'emerald'> = {
  1: 'destructive', 2: 'amber', 3: 'default', 4: 'emerald', 5: 'emerald',
}

export default function FlashcardTab({ disciplinas, flashcards: initialCards, concursoId }: Props) {
  const router = useRouter()
  const toast  = useToast()
  const [cards, setCards]             = useState<Flashcard[]>(initialCards)
  const [mode, setMode]               = useState<Mode>('list')
  const [selectedDisc, setSelectedDisc] = useState<string | null>(null)
  const [studyIndex, setStudyIndex]   = useState(0)
  const [flipped, setFlipped]         = useState(false)
  const [generating, setGenerating]   = useState<string | null>(null)

  const dueCards = useMemo(() => cards.filter(c => isDue(c.prox_revisao)), [cards])
  const studyQueue = useMemo(() => {
    const disc = selectedDisc
      ? cards.filter(c => c.disciplina_id === selectedDisc && isDue(c.prox_revisao))
      : dueCards
    return disc.sort((a, b) => new Date(a.prox_revisao).getTime() - new Date(b.prox_revisao).getTime())
  }, [cards, selectedDisc, dueCards])

  const currentCard = studyQueue[studyIndex]

  function startStudy(discId: string | null) {
    setSelectedDisc(discId); setStudyIndex(0); setFlipped(false); setMode('study')
  }

  async function handleAnswer(acertou: boolean) {
    if (!currentCard) return
    const { box, proxRevisao } = advanceBox(currentCard.box, acertou)
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, box, prox_revisao: proxRevisao.toISOString() } : c))
    await createClient().from('flashcards').update({ box, prox_revisao: proxRevisao.toISOString() }).eq('id', currentCard.id)
    setFlipped(false)
    if (studyIndex + 1 >= studyQueue.length) { router.refresh(); setMode('list') }
    else setStudyIndex(i => i + 1)
  }

  async function handleGerar(discId: string, discNome: string) {
    setGenerating(discId)
    try {
      const res = await fetch('/api/gerar-flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaId: discId, disciplinaNome: discNome }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('Flashcards gerados!', `Novos cards de ${discNome} prontos para estudo.`)
      router.refresh()
    } catch (err: unknown) {
      toast.error('Erro ao gerar flashcards', err instanceof Error ? err.message : 'Tente novamente.')
    }
    setGenerating(null)
  }

  if (mode === 'study') {
    if (!currentCard) {
      return (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
            </svg>
          </div>
          <h2 className="font-bold text-foreground text-lg">Sessão concluída!</h2>
          <p className="text-muted-foreground text-sm mt-1">Todos os cards revisados.</p>
          <Button className="mt-5" onClick={() => setMode('list')}>Voltar</Button>
        </div>
      )
    }

    const discNome = disciplinas.find(d => d.id === currentCard.disciplina_id)?.nome ?? ''

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMode('list')} className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-muted transition-colors cursor-pointer">
            ← Sair
          </button>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {studyIndex + 1}/{studyQueue.length}
          </span>
        </div>

        <div className="flex justify-center">
          <Badge variant={BOX_VARIANT[currentCard.box] as any}>
            Caixa {currentCard.box} — {BOX_LABEL[currentCard.box]}
          </Badge>
        </div>

        <motion.div
          key={`${currentCard.id}-${flipped ? 'back' : 'front'}`}
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="bg-surface rounded-2xl border border-border min-h-48 cursor-pointer flex flex-col items-center justify-center p-6 hover:border-[#3D4158] hover:shadow-xl hover:shadow-black/20 transition-colors select-none"
          onClick={() => setFlipped(v => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setFlipped(v => !v)}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            {flipped ? 'Verso' : 'Frente'} · {discNome}
          </p>
          <p className="text-foreground text-center text-base leading-relaxed">{flipped ? currentCard.verso : currentCard.frente}</p>
          {!flipped && <p className="font-mono text-[10px] uppercase tracking-widest text-border mt-4">Clique para revelar</p>}
        </motion.div>

        <AnimatePresence mode="wait">
          {flipped ? (
            <motion.div key="answer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-3">
              <Button variant="destructive" size="lg" onClick={() => handleAnswer(false)}>Revisar</Button>
              <button
                onClick={() => handleAnswer(true)}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 py-3 text-sm font-semibold hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-150 cursor-pointer"
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
    )
  }

  return (
    <div className="space-y-4">
      {dueCards.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-400 text-sm">{dueCards.length} card{dueCards.length !== 1 ? 's' : ''} para revisar</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500/60 mt-0.5">Todos os decks</p>
          </div>
          <Button variant="amber" onClick={() => startStudy(null)}>Estudar agora</Button>
        </div>
      )}


      {disciplinas.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">Crie um plano de estudos primeiro.</p>
      ) : (
        disciplinas.map(disc => {
          const discCards = cards.filter(c => c.disciplina_id === disc.id)
          const discDue   = discCards.filter(c => isDue(c.prox_revisao))
          const dominados = discCards.filter(c => c.box >= 4).length

          return (
            <Card key={disc.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">{disc.nome}</h3>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                      {discCards.length} cards · {discDue.length} para revisar
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {discDue.length > 0 && (
                      <Button size="sm" onClick={() => startStudy(disc.id)}>Estudar ({discDue.length})</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleGerar(disc.id, disc.nome)} disabled={generating === disc.id}>
                      {generating === disc.id ? '…' : '+ IA'}
                    </Button>
                  </div>
                </div>
                {discCards.length > 0 && (
                  <ProgressBar value={dominados} max={discCards.length} color="emerald" size="sm" showPercent label="Domínio" />
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
