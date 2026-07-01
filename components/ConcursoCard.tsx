'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import ProgressBar from './ProgressBar'
import type { Concurso } from '@/types'

interface Props {
  concurso: Concurso
  topicoTotal: number
  topicoEstudados: number
  flashcardTotal: number
  flashcardDominados: number
  onDelete: (id: string) => void
}

export default function ConcursoCard({ concurso, topicoTotal, topicoEstudados, flashcardTotal, flashcardDominados, onDelete }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        className="group bg-surface rounded-xl border border-border p-5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-black/10 transition-colors duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <Link href={`/concurso/${concurso.id}`} className="flex-1 min-w-0 cursor-pointer">
            <h2 className="font-bold text-foreground text-base leading-tight tracking-tight truncate group-hover:text-blue-500 transition-colors duration-150">
              {concurso.nome}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {concurso.cargo && <Badge variant="secondary">{concurso.cargo}</Badge>}
              {concurso.banca && <Badge variant="outline">{concurso.banca}</Badge>}
              {concurso.ano   && <Badge variant="outline">{concurso.ano}</Badge>}
            </div>
          </Link>

          <div className="ml-3 flex-shrink-0">
            <button
              onClick={() => setConfirmOpen(true)}
              className="md:opacity-0 md:group-hover:opacity-100 p-1.5 rounded-lg text-border hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 focus:opacity-100 md:focus-visible:opacity-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label={`Excluir concurso ${concurso.nome}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <Link href={`/concurso/${concurso.id}`} className="block space-y-3 cursor-pointer">
          <ProgressBar value={topicoEstudados} max={topicoTotal} color="blue" label="Plano" showPercent size="sm" />
          <ProgressBar value={flashcardDominados} max={flashcardTotal} color="emerald" label="Domínio" showPercent size="sm" />
        </Link>
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onDelete(concurso.id)}
        title={`Excluir "${concurso.nome}"?`}
        description="Esta ação apaga permanentemente disciplinas, tópicos, flashcards e questões deste concurso."
        confirmLabel="Excluir permanentemente"
        destructive
        requireTypedName={concurso.nome}
      />
    </>
  )
}
