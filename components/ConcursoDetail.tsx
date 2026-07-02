'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Download } from 'lucide-react'
import type { Concurso, Disciplina, Topico, Flashcard, Questao, Resumo } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import PlanoTab    from './PlanoTab'
import FlashcardTab from './FlashcardTab'
import QuestaoTab  from './QuestaoTab'
import ResumoTab   from './ResumoTab'
import ProgressBar from './ProgressBar'
import ShellLayout  from './ShellLayout'

interface Props {
  concurso:    Concurso
  disciplinas: Disciplina[]
  topicos:     Topico[]
  flashcards:  Flashcard[]
  questoes:    Questao[]
  resumos:     Resumo[]
}

type Tab = 'plano' | 'flashcards' | 'questoes' | 'resumos'

export default function ConcursoDetail({ concurso, disciplinas, topicos, flashcards, questoes, resumos }: Props) {
  const [tab, setTab] = useState<Tab>('plano')

  const totalTopicos  = topicos.length
  const estudados     = topicos.filter(t => t.estudado).length
  const totalFlashcards = flashcards.length
  const dominados     = flashcards.filter(f => f.box >= 4).length

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'plano',      label: 'Plano',      count: totalTopicos },
    { key: 'flashcards', label: 'Flashcards', count: totalFlashcards },
    { key: 'questoes',   label: 'Questões',   count: questoes.length },
    { key: 'resumos',    label: 'Resumos',    count: resumos.length },
  ]

  const headerRight = (
    <div className="flex items-center gap-3">
      <a
        href={`/api/export/${concurso.id}`}
        download
        className="flex items-center gap-1.5 text-muted-foreground hover:text-muted transition-colors cursor-pointer text-sm"
        title="Baixar deck (Anki-compatível)"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Exportar</span>
      </a>
      <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-muted transition-colors cursor-pointer text-sm">
        <ArrowLeft size={14} />
        Voltar
      </Link>
    </div>
  )

  return (
    <ShellLayout title={concurso.nome} headerRight={headerRight}>
      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          {concurso.cargo && <Badge variant="secondary">{concurso.cargo}</Badge>}
          {concurso.banca && <Badge variant="outline">{concurso.banca}</Badge>}
          {concurso.ano   && <Badge variant="outline">{concurso.ano}</Badge>}
        </div>

        {/* Progress stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <ProgressBar value={estudados} max={totalTopicos} color="blue" label="Plano de estudos" showPercent />
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                {estudados}/{totalTopicos} tópicos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <ProgressBar value={dominados} max={totalFlashcards} color="emerald" label="Domínio" showPercent />
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                {dominados}/{totalFlashcards} cards ≥ caixa 4
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="relative flex border-b border-border -mx-6 px-6 gap-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative pb-3 px-3 text-sm font-semibold transition-colors duration-150 cursor-pointer ${
                tab === t.key ? 'text-amber-400' : 'text-muted-foreground hover:text-muted'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 font-mono text-[10px] ${tab === t.key ? 'text-amber-500' : 'text-border'}`}>
                  {t.count}
                </span>
              )}
              {tab === t.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'plano'      && <PlanoTab    disciplinas={disciplinas} topicos={topicos} concursoId={concurso.id} />}
            {tab === 'flashcards' && <FlashcardTab disciplinas={disciplinas} flashcards={flashcards} topicos={topicos} />}
            {tab === 'questoes'   && <QuestaoTab   disciplinas={disciplinas} questoes={questoes} topicos={topicos} />}
            {tab === 'resumos'    && <ResumoTab    disciplinas={disciplinas} resumos={resumos} topicos={topicos} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </ShellLayout>
  )
}
