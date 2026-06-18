'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProgressBar from './ProgressBar'
import type { Disciplina, Topico } from '@/types'

interface Props {
  disciplinas: Disciplina[]
  topicos: Topico[]
  concursoId: string
}

export default function PlanoTab({ disciplinas, topicos: initialTopicos, concursoId }: Props) {
  const router = useRouter()
  const [topicos, setTopicos] = useState<Topico[]>(initialTopicos)
  const [generating, setGenerating] = useState(false)
  const [editaisText, setEditaisText] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [genError, setGenError] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(disciplinas.map(d => d.id)))

  async function toggleTopico(topico: Topico) {
    const updated = !topico.estudado
    setTopicos(prev => prev.map(t => t.id === topico.id ? { ...t, estudado: updated } : t))
    await createClient().from('topicos').update({ estudado: updated }).eq('id', topico.id)
  }

  async function handleGerarPlano(e: React.FormEvent) {
    e.preventDefault()
    if (!editaisText.trim()) return
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: editaisText, concursoId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setEditaisText('')
      setShowImport(false)
      router.refresh()
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Erro ao gerar plano')
    }
    setGenerating(false)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (disciplinas.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 text-sm mb-3">Nenhuma disciplina ainda.</p>
          <button
            onClick={() => setShowImport(true)}
            className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
          >
            Importar edital com IA →
          </button>
        </div>
        {showImport && (
          <ImportEditalForm
            value={editaisText}
            onChange={setEditaisText}
            onSubmit={handleGerarPlano}
            onCancel={() => setShowImport(false)}
            loading={generating}
            error={genError}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm">{disciplinas.length} disciplinas</p>
        <button
          onClick={() => setShowImport(v => !v)}
          className="font-mono text-[10px] uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
        >
          + Reimportar edital
        </button>
      </div>

      {showImport && (
        <ImportEditalForm
          value={editaisText}
          onChange={setEditaisText}
          onSubmit={handleGerarPlano}
          onCancel={() => setShowImport(false)}
          loading={generating}
          error={genError}
        />
      )}

      {disciplinas.map(disc => {
        const discTopicos = topicos.filter(t => t.disciplina_id === disc.id)
        const estudados = discTopicos.filter(t => t.estudado).length
        const isOpen = expanded.has(disc.id)

        return (
          <div key={disc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => toggleExpand(disc.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300"
            >
              <div className="flex items-center gap-3 min-w-0">
                <svg
                  className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-90' : ''}`}
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708" />
                </svg>
                <span className="font-semibold text-slate-900 text-sm truncate text-left">{disc.nome}</span>
              </div>
              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                  {estudados}/{discTopicos.length}
                </span>
                <div className="w-16">
                  <ProgressBar value={estudados} max={discTopicos.length} color="blue" size="sm" />
                </div>
              </div>
            </button>

            {isOpen && discTopicos.length > 0 && (
              <ul className="border-t border-slate-100 divide-y divide-slate-50">
                {discTopicos.map(topico => (
                  <li key={topico.id}>
                    <label className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={topico.estudado}
                        onChange={() => toggleTopico(topico)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer flex-shrink-0"
                      />
                      <span className={`text-sm leading-relaxed transition-colors ${topico.estudado ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {topico.texto}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ImportEditalForm({
  value, onChange, onSubmit, onCancel, loading, error
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  loading: boolean
  error: string
}) {
  return (
    <div className="bg-white rounded-xl border border-blue-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-1 text-sm">Importar edital com IA</h3>
      <p className="text-slate-500 text-xs mb-3">
        Cole o conteúdo programático do edital. A IA vai organizar em disciplinas e tópicos.
      </p>
      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={6}
          placeholder="Cole aqui o conteúdo programático do edital…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
          >
            {loading ? 'Gerando plano…' : 'Gerar plano com IA'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 rounded-lg border border-slate-200 text-slate-600 py-2 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
