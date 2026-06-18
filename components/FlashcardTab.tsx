'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { advanceBox, isDue } from '@/lib/leitner'
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

export default function FlashcardTab({ disciplinas, flashcards: initialCards, concursoId }: Props) {
  const router = useRouter()
  const [cards, setCards] = useState<Flashcard[]>(initialCards)
  const [mode, setMode] = useState<Mode>('list')
  const [selectedDisc, setSelectedDisc] = useState<string | null>(null)
  const [studyIndex, setStudyIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [genError, setGenError] = useState('')

  const dueCards = useMemo(() => cards.filter(c => isDue(c.prox_revisao)), [cards])
  const studyQueue = useMemo(() => {
    const disc = selectedDisc
      ? cards.filter(c => c.disciplina_id === selectedDisc && isDue(c.prox_revisao))
      : dueCards
    return disc.sort((a, b) => new Date(a.prox_revisao).getTime() - new Date(b.prox_revisao).getTime())
  }, [cards, selectedDisc, dueCards])

  const currentCard = studyQueue[studyIndex]

  function startStudy(discId: string | null) {
    setSelectedDisc(discId)
    setStudyIndex(0)
    setFlipped(false)
    setMode('study')
  }

  async function handleAnswer(acertou: boolean) {
    if (!currentCard) return
    const { box, proxRevisao } = advanceBox(currentCard.box, acertou)
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, box, prox_revisao: proxRevisao.toISOString() } : c))
    await createClient().from('flashcards').update({ box, prox_revisao: proxRevisao.toISOString() }).eq('id', currentCard.id)
    setFlipped(false)
    if (studyIndex + 1 >= studyQueue.length) {
      router.refresh()
      setMode('list')
    } else {
      setStudyIndex(i => i + 1)
    }
  }

  async function handleGerar(discId: string, discNome: string) {
    const disc = disciplinas.find(d => d.id === discId)
    if (!disc) return
    setGenerating(discId)
    setGenError('')
    try {
      const res = await fetch('/api/gerar-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaId: discId, disciplinaNome: discNome }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Erro ao gerar flashcards')
    }
    setGenerating(null)
  }

  if (mode === 'study') {
    if (!currentCard) {
      return (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 mb-4">
            <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
            </svg>
          </div>
          <h2 className="font-bold text-slate-900 text-lg">Sessão concluída!</h2>
          <p className="text-slate-500 text-sm mt-1">Todos os cards revisados.</p>
          <button
            onClick={() => setMode('list')}
            className="mt-5 rounded-lg bg-blue-600 text-white px-5 py-2 text-sm font-semibold hover:bg-blue-700 transition"
          >
            Voltar
          </button>
        </div>
      )
    }

    const discNome = disciplinas.find(d => d.id === currentCard.disciplina_id)?.nome ?? ''

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('list')}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Sair
          </button>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            {studyIndex + 1}/{studyQueue.length}
          </span>
        </div>

        <div className="flex justify-center">
          <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${
            currentCard.box <= 1 ? 'bg-red-50 text-red-400' :
            currentCard.box <= 2 ? 'bg-amber-50 text-amber-500' :
            currentCard.box <= 3 ? 'bg-blue-50 text-blue-400' :
            'bg-emerald-50 text-emerald-500'
          }`}>
            Caixa {currentCard.box} — {BOX_LABEL[currentCard.box]}
          </span>
        </div>

        <div
          className="bg-white rounded-2xl border border-slate-200 min-h-48 cursor-pointer flex flex-col items-center justify-center p-6 shadow-sm hover:shadow-md transition-all select-none"
          onClick={() => setFlipped(v => !v)}
          role="button"
          aria-label={flipped ? 'Mostrar frente' : 'Revelar resposta'}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? setFlipped(v => !v) : undefined}
        >
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-3">
            {flipped ? 'Verso' : 'Frente'} · {discNome}
          </p>
          <p className="text-slate-900 text-center text-base leading-relaxed">
            {flipped ? currentCard.verso : currentCard.frente}
          </p>
          {!flipped && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-300 mt-4">
              Clique para revelar
            </p>
          )}
        </div>

        {flipped ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAnswer(false)}
              className="rounded-xl border-2 border-red-200 bg-red-50 text-red-600 py-3 text-sm font-semibold hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-300 transition"
            >
              Revisar
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 py-3 text-sm font-semibold hover:bg-emerald-100 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
            >
              Acertei
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="w-full rounded-xl bg-blue-600 text-white py-3 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            Revelar resposta
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {dueCards.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} para revisar
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500 mt-0.5">
              Todos os decks
            </p>
          </div>
          <button
            onClick={() => startStudy(null)}
            className="rounded-lg bg-amber-500 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
          >
            Estudar agora
          </button>
        </div>
      )}

      {genError && <p className="text-red-500 text-sm rounded-lg bg-red-50 px-3 py-2">{genError}</p>}

      {disciplinas.length === 0 ? (
        <p className="text-center text-slate-500 text-sm py-8">
          Crie um plano de estudos primeiro para gerar flashcards.
        </p>
      ) : (
        disciplinas.map(disc => {
          const discCards = cards.filter(c => c.disciplina_id === disc.id)
          const discDue = discCards.filter(c => isDue(c.prox_revisao))
          const dominados = discCards.filter(c => c.box >= 4).length

          return (
            <div key={disc.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{disc.nome}</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">
                    {discCards.length} cards · {discDue.length} para revisar
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  {discDue.length > 0 && (
                    <button
                      onClick={() => startStudy(disc.id)}
                      className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      Estudar ({discDue.length})
                    </button>
                  )}
                  <button
                    onClick={() => handleGerar(disc.id, disc.nome)}
                    disabled={generating === disc.id}
                    className="rounded-lg border border-slate-200 text-slate-500 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
                  >
                    {generating === disc.id ? '…' : '+ IA'}
                  </button>
                </div>
              </div>
              {discCards.length > 0 && (
                <ProgressBar value={dominados} max={discCards.length} color="emerald" size="sm" showPercent label="Domínio" />
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
