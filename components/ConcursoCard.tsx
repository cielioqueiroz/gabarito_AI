'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProgressBar from './ProgressBar'
import type { Concurso } from '@/types'

interface ConcursoCardProps {
  concurso: Concurso
  topicoTotal: number
  topicoEstudados: number
  flashcardTotal: number
  flashcardDominados: number
  onDelete: (id: string) => void
}

export default function ConcursoCard({
  concurso,
  topicoTotal,
  topicoEstudados,
  flashcardTotal,
  flashcardDominados,
  onDelete,
}: ConcursoCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between mb-3">
        <Link href={`/concurso/${concurso.id}`} className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-900 text-base leading-tight tracking-tight truncate group-hover:text-blue-600 transition-colors">
            {concurso.nome}
          </h2>
          <div className="flex flex-wrap gap-x-3 mt-1">
            {concurso.cargo && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                {concurso.cargo}
              </span>
            )}
            {concurso.banca && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                {concurso.banca}
              </span>
            )}
            {concurso.ano && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                {concurso.ano}
              </span>
            )}
          </div>
        </Link>

        <div className="ml-3 flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDelete(concurso.id)}
                className="font-mono text-[10px] uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-1 rounded focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Excluir concurso"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <Link href={`/concurso/${concurso.id}`} className="block space-y-2.5">
        <ProgressBar
          value={topicoEstudados}
          max={topicoTotal}
          color="blue"
          label="Plano"
          showPercent
          size="sm"
        />
        <ProgressBar
          value={flashcardDominados}
          max={flashcardTotal}
          color="emerald"
          label="Domínio"
          showPercent
          size="sm"
        />
      </Link>
    </div>
  )
}
