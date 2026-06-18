'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ProgressBar from './ProgressBar'
import type { Disciplina, Topico } from '@/types'

interface Props {
  disciplinas: Disciplina[]
  topicos: Topico[]
  concursoId: string
}

export default function PlanoTab({ disciplinas, topicos: initialTopicos, concursoId }: Props) {
  const router = useRouter()
  const [topicos, setTopicos]     = useState<Topico[]>(initialTopicos)
  const [generating, setGenerating] = useState(false)
  const [editaisText, setEditaisText] = useState('')
  const [showImport, setShowImport]   = useState(false)
  const [genError, setGenError]       = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(disciplinas.map(d => d.id)))

  async function toggleTopico(topico: Topico) {
    const updated = !topico.estudado
    setTopicos(prev => prev.map(t => t.id === topico.id ? { ...t, estudado: updated } : t))
    await createClient().from('topicos').update({ estudado: updated }).eq('id', topico.id)
  }

  async function handleGerarPlano(e: React.FormEvent) {
    e.preventDefault()
    if (!editaisText.trim()) return
    setGenerating(true); setGenError('')
    try {
      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: editaisText, concursoId }),
      })
      if (!res.ok) throw new Error(await res.text())
      setEditaisText(''); setShowImport(false); router.refresh()
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Erro ao gerar plano')
    }
    setGenerating(false)
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (disciplinas.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="text-center py-10">
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-sm mb-3">Nenhuma disciplina ainda.</p>
            <button onClick={() => setShowImport(true)} className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors cursor-pointer">
              Importar edital com IA →
            </button>
          </CardContent>
        </Card>
        <AnimatePresence>
          {showImport && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <ImportEditalForm value={editaisText} onChange={setEditaisText} onSubmit={handleGerarPlano} onCancel={() => setShowImport(false)} loading={generating} error={genError} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{disciplinas.length} disciplinas</p>
        <button onClick={() => setShowImport(v => !v)} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
          <Sparkles size={11} /> Reimportar edital
        </button>
      </div>

      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <ImportEditalForm value={editaisText} onChange={setEditaisText} onSubmit={handleGerarPlano} onCancel={() => setShowImport(false)} loading={generating} error={genError} />
          </motion.div>
        )}
      </AnimatePresence>

      {disciplinas.map(disc => {
        const discTopicos = topicos.filter(t => t.disciplina_id === disc.id)
        const estudados   = discTopicos.filter(t => t.estudado).length
        const isOpen      = expanded.has(disc.id)

        return (
          <Card key={disc.id} className="overflow-hidden">
            <button
              onClick={() => toggleExpand(disc.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-elevated transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                </motion.div>
                <span className="font-semibold text-foreground text-sm truncate text-left">{disc.nome}</span>
              </div>
              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {estudados}/{discTopicos.length}
                </span>
                <div className="w-16">
                  <ProgressBar value={estudados} max={discTopicos.length} color="blue" size="sm" />
                </div>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && discTopicos.length > 0 && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-elevated divide-y divide-border"
                >
                  {discTopicos.map(topico => (
                    <li key={topico.id}>
                      <label className="flex items-start gap-3 px-4 py-3 hover:bg-elevated cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={topico.estudado}
                          onChange={() => toggleTopico(topico)}
                          className="mt-0.5 w-4 h-4 rounded border-border bg-elevated text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-surface cursor-pointer flex-shrink-0 accent-blue-500"
                        />
                        <span className={`text-sm leading-relaxed transition-colors ${topico.estudado ? 'text-muted-foreground line-through' : 'text-muted'}`}>
                          {topico.texto}
                        </span>
                      </label>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </Card>
        )
      })}
    </div>
  )
}

function ImportEditalForm({ value, onChange, onSubmit, onCancel, loading, error }: {
  value: string; onChange: (v: string) => void; onSubmit: (e: React.FormEvent) => void
  onCancel: () => void; loading: boolean; error: string
}) {
  return (
    <Card className="border-blue-500/30">
      <CardContent className="pt-4">
        <h3 className="font-semibold text-foreground mb-1 text-sm">Importar edital com IA</h3>
        <p className="text-muted-foreground text-xs mb-3">Cole o conteúdo programático do edital. A IA vai organizar em disciplinas e tópicos.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={6}
            placeholder="Cole aqui o conteúdo programático do edital…"
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none font-mono"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !value.trim()} className="flex-1">
              {loading ? 'Gerando plano…' : 'Gerar plano com IA'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
