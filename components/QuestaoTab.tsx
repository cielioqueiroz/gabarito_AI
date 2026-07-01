'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Disciplina, Questao, Alternativa } from '@/types'

interface Props { disciplinas: Disciplina[]; questoes: Questao[] }
interface QuestaoState { selected: string | null; revealed: boolean; correta?: string; explicacao?: string | null }

export default function QuestaoTab({ disciplinas, questoes }: Props) {
  const router = useRouter()
  const toast  = useToast()
  const [states, setStates]         = useState<Record<string, QuestaoState>>({})
  const [selectedDisc, setSelectedDisc] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)

  const filtered = selectedDisc ? questoes.filter(q => q.disciplina_id === selectedDisc) : questoes

  function getState(id: string): QuestaoState { return states[id] ?? { selected: null, revealed: false } }

  async function handleSelect(questao: Questao, letra: string) {
    const st = getState(questao.id)
    if (st.revealed) return
    setStates(prev => ({ ...prev, [questao.id]: { selected: letra, revealed: true } }))
    try {
      const res = await fetch('/api/responder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questaoId: questao.id, letra }),
      })
      if (res.status === 429) throw new Error('Muitas requisições. Aguarde alguns segundos.')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { acertou: boolean; correta: string; explicacao: string | null }
      setStates(prev => ({ ...prev, [questao.id]: { selected: letra, revealed: true, correta: data.correta, explicacao: data.explicacao } }))
    } catch {
      toast.error('Erro ao registrar resposta')
    }
  }

  async function handleGerar(discId: string, discNome: string) {
    setGenerating(discId)
    try {
      const res = await fetch('/api/gerar-questoes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaId: discId, disciplinaNome: discNome }),
      })
      if (res.status === 429) throw new Error('Muitas requisições. Aguarde alguns segundos.')
      if (!res.ok) throw new Error(await res.text())
      toast.success('Questões geradas!', `Novas questões de ${discNome} disponíveis.`)
      router.refresh()
    } catch (err: unknown) {
      toast.error('Erro ao gerar questões', err instanceof Error ? err.message : 'Tente novamente.')
    }
    setGenerating(null)
  }

  const answered = Object.values(states).filter(s => s.revealed).length
  const correct  = Object.values(states).filter(s => s.revealed && s.correta === s.selected).length

  return (
    <div className="space-y-4">

      {/* Discipline filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedDisc(null)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer',
            !selectedDisc ? 'bg-blue-600 text-white' : 'bg-elevated text-muted hover:bg-border'
          )}
        >
          Todas ({questoes.length})
        </button>
        {disciplinas.map(disc => (
          <button
            key={disc.id}
            onClick={() => setSelectedDisc(disc.id)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer',
              selectedDisc === disc.id ? 'bg-blue-600 text-white' : 'bg-elevated text-muted hover:bg-border'
            )}
          >
            {disc.nome} ({questoes.filter(q => q.disciplina_id === disc.id).length})
          </button>
        ))}
      </div>

      {/* Score bar */}
      {answered > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Respondidas</span>
                <p className="font-bold text-foreground text-lg leading-none mt-0.5">{answered}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Corretas</span>
                <p className="font-bold text-emerald-400 text-lg leading-none mt-0.5">{correct}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Taxa</span>
                <p className="font-bold text-foreground text-lg leading-none mt-0.5">{Math.round((correct / answered) * 100)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {disciplinas.map(disc => {
        const discQuestoes = filtered.filter(q => q.disciplina_id === disc.id)
        if (selectedDisc && selectedDisc !== disc.id) return null
        return (
          <div key={disc.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">{disc.nome}</h3>
              <Button size="sm" variant="outline" onClick={() => handleGerar(disc.id, disc.nome)} disabled={generating === disc.id}>
                {generating === disc.id ? 'Gerando…' : '+ Gerar com IA'}
              </Button>
            </div>
            {discQuestoes.length === 0
              ? <p className="text-muted-foreground text-sm italic px-1">Nenhuma questão ainda.</p>
              : discQuestoes.map((questao, idx) => (
                  <QuestaoCard key={questao.id} questao={questao} index={idx + 1} state={getState(questao.id)} onSelect={letra => handleSelect(questao, letra)} />
                ))
            }
          </div>
        )
      })}
    </div>
  )
}

function QuestaoCard({ questao, index, state, onSelect }: { questao: Questao; index: number; state: QuestaoState; onSelect: (l: string) => void }) {
  const { selected, revealed, correta, explicacao } = state
  const acertou = revealed && selected === correta

  function altClass(alt: Alternativa) {
    const base = 'flex items-start gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-left transition-all duration-150 '
    if (!revealed) return base + 'border border-border hover:border-blue-500/40 hover:bg-blue-500/5 cursor-pointer'
    if (alt.letra === correta) return base + 'border border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-default'
    if (alt.letra === selected) return base + 'border border-red-500 bg-red-500/10 text-red-400 cursor-default'
    return base + 'border border-elevated text-muted-foreground cursor-default'
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="pt-4">
          <Badge variant="secondary" className="mb-2">Questão {index}</Badge>
          <p className="text-muted text-sm leading-relaxed mb-4">{questao.enunciado}</p>
          <div className="space-y-2">
            {questao.alternativas.map(alt => (
              <button key={alt.letra} onClick={() => onSelect(alt.letra)} disabled={revealed} className={altClass(alt)}>
                <span className="font-mono font-bold text-[11px] flex-shrink-0 mt-0.5 w-4 text-muted-foreground">{alt.letra}</span>
                <span className="leading-relaxed">{alt.texto}</span>
              </button>
            ))}
          </div>

          {revealed && explicacao && (
            <div className="mt-4 bg-elevated rounded-lg border border-border px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Explicação</p>
              <p className="text-muted text-sm leading-relaxed">{explicacao}</p>
            </div>
          )}

          {revealed && correta && (
            <div className={cn('mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest', acertou ? 'text-emerald-400' : 'text-red-400')}>
              {acertou
                ? <><svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z"/></svg>Correto!</>
                : <><svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/></svg>Errado — correta: {correta}</>
              }
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
