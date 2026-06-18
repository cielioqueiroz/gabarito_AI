'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Concurso, Disciplina, Topico, Flashcard, Questao } from '@/types'
import PlanoTab from './PlanoTab'
import FlashcardTab from './FlashcardTab'
import QuestaoTab from './QuestaoTab'
import ProgressBar from './ProgressBar'

interface Props {
  concurso: Concurso
  disciplinas: Disciplina[]
  topicos: Topico[]
  flashcards: Flashcard[]
  questoes: Questao[]
}

type Tab = 'plano' | 'flashcards' | 'questoes'

export default function ConcursoDetail({ concurso, disciplinas, topicos, flashcards, questoes }: Props) {
  const [tab, setTab] = useState<Tab>('plano')

  const totalTopicos = topicos.length
  const estudados = topicos.filter(t => t.estudado).length
  const totalFlashcards = flashcards.length
  const dominados = flashcards.filter(f => f.box >= 4).length

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'plano', label: 'Plano', count: totalTopicos },
    { key: 'flashcards', label: 'Flashcards', count: totalFlashcards },
    { key: 'questoes', label: 'Questões', count: questoes.length },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 -ml-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Voltar"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
            </svg>
          </Link>
          <span className="font-mono text-lg font-bold text-slate-900 tracking-tight">
            gabarito<span className="inline-block w-1.5 h-4 bg-blue-600 ml-0.5 align-middle animate-blink" />
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <h1 className="font-bold text-slate-900 text-xl tracking-tight">{concurso.nome}</h1>
        <div className="flex flex-wrap gap-x-3 mt-1 mb-4">
          {concurso.cargo && <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{concurso.cargo}</span>}
          {concurso.banca && <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{concurso.banca}</span>}
          {concurso.ano && <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{concurso.ano}</span>}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <ProgressBar
              value={estudados}
              max={totalTopicos}
              color="blue"
              label="Plano de estudos"
              showPercent
            />
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-2">
              {estudados}/{totalTopicos} tópicos
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <ProgressBar
              value={dominados}
              max={totalFlashcards}
              color="emerald"
              label="Domínio"
              showPercent
            />
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mt-2">
              {dominados}/{totalFlashcards} cards ≥ caixa 4
            </p>
          </div>
        </div>

        <nav className="flex border-b border-slate-200 -mx-4 px-4 gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 px-3 text-sm font-semibold transition-colors relative ${
                tab === t.key
                  ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:rounded-full'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 font-mono text-[10px] ${tab === t.key ? 'text-blue-400' : 'text-slate-300'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {tab === 'plano' && (
          <PlanoTab
            disciplinas={disciplinas}
            topicos={topicos}
            concursoId={concurso.id}
          />
        )}
        {tab === 'flashcards' && (
          <FlashcardTab
            disciplinas={disciplinas}
            flashcards={flashcards}
            concursoId={concurso.id}
          />
        )}
        {tab === 'questoes' && (
          <QuestaoTab
            disciplinas={disciplinas}
            questoes={questoes}
            concursoId={concurso.id}
          />
        )}
      </div>
    </div>
  )
}
