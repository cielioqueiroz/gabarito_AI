'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
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
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="destructive" onClick={() => onDelete(concurso.id)}>Confirmar</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-border hover:text-red-500 hover:bg-red-500/10 transition-all duration-150 focus:opacity-100 cursor-pointer"
              aria-label="Excluir concurso"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <Link href={`/concurso/${concurso.id}`} className="block space-y-3 cursor-pointer">
        <ProgressBar value={topicoEstudados} max={topicoTotal} color="blue" label="Plano" showPercent size="sm" />
        <ProgressBar value={flashcardDominados} max={flashcardTotal} color="emerald" label="Domínio" showPercent size="sm" />
      </Link>
    </motion.div>
  )
}
