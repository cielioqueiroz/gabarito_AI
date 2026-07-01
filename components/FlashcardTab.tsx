'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { isDue } from '@/lib/leitner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ProgressBar from './ProgressBar'
import FlashcardStudy from './FlashcardStudy'
import type { Disciplina, Flashcard } from '@/types'

interface Props {
  disciplinas: Disciplina[]
  flashcards: Flashcard[]
}

type Mode = 'list' | 'study'

export default function FlashcardTab({ disciplinas, flashcards: initialCards }: Props) {
  const router = useRouter()
  const toast  = useToast()
  const [cards, setCards] = useState<Flashcard[]>(initialCards)
  const [mode, setMode] = useState<Mode>('list')
  const [selectedDisc, setSelectedDisc] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)

  const dueCards = useMemo(() => cards.filter(c => isDue(c.prox_revisao)), [cards])
  const studyQueue = useMemo(() => {
    const filtered = selectedDisc
      ? cards.filter(c => c.disciplina_id === selectedDisc && isDue(c.prox_revisao))
      : dueCards
    return [...filtered].sort((a, b) => new Date(a.prox_revisao).getTime() - new Date(b.prox_revisao).getTime())
  }, [cards, selectedDisc, dueCards])

  function startStudy(discId: string | null) {
    setSelectedDisc(discId); setMode('study')
  }

  async function handleGerar(discId: string, discNome: string) {
    setGenerating(discId)
    try {
      const res = await fetch('/api/gerar-flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaId: discId, disciplinaNome: discNome }),
      })
      if (res.status === 429) throw new Error('Muitas requisições. Aguarde alguns segundos.')
      if (!res.ok) throw new Error(await res.text())
      toast.success('Flashcards gerados!', `Novos cards de ${discNome} prontos para estudo.`)
      router.refresh()
    } catch (err: unknown) {
      toast.error('Erro ao gerar flashcards', err instanceof Error ? err.message : 'Tente novamente.')
    }
    setGenerating(null)
  }

  const discNameOf = (card: Flashcard) => disciplinas.find(d => d.id === card.disciplina_id)?.nome ?? ''

  if (mode === 'study') {
    if (studyQueue.length === 0) {
      return (
        <div className="text-center py-16">
          <h2 className="font-bold text-foreground text-lg">Sessão concluída!</h2>
          <p className="text-muted-foreground text-sm mt-1">Todos os cards revisados.</p>
          <Button className="mt-5" onClick={() => setMode('list')}>Voltar</Button>
        </div>
      )
    }
    return (
      <FlashcardStudy
        cards={studyQueue}
        discNameOf={discNameOf}
        onAnswer={(_orig, updated) => {
          setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
        }}
        onExit={() => setMode('list')}
        onFinish={() => { router.refresh(); setMode('list') }}
      />
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
