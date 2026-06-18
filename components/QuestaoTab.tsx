'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Disciplina, Questao, Alternativa } from '@/types'

interface Props {
  disciplinas: Disciplina[]
  questoes: Questao[]
  concursoId: string
}

interface QuestaoState {
  selected: string | null
  revealed: boolean
}

export default function QuestaoTab({ disciplinas, questoes, concursoId }: Props) {
  const router = useRouter()
  const [states, setStates] = useState<Record<string, QuestaoState>>({})
  const [selectedDisc, setSelectedDisc] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [genError, setGenError] = useState('')

  const filtered = selectedDisc
    ? questoes.filter(q => q.disciplina_id === selectedDisc)
    : questoes

  function getState(questaoId: string): QuestaoState {
    return states[questaoId] ?? { selected: null, revealed: false }
  }

  async function handleSelect(questao: Questao, letra: string) {
    const st = getState(questao.id)
    if (st.revealed) return
    setStates(prev => ({ ...prev, [questao.id]: { selected: letra, revealed: true } }))
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      await sb.from('respostas').insert({
        user_id: user.id,
        questao_id: questao.id,
        acertou: letra === questao.correta,
      })
    }
  }

  async function handleGerar(discId: string, discNome: string) {
    setGenerating(discId)
    setGenError('')
    try {
      const res = await fetch('/api/gerar-questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaId: discId, disciplinaNome: discNome }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Erro ao gerar questões')
    }
    setGenerating(null)
  }

  const answered = Object.values(states).filter(s => s.revealed).length
  const correct = Object.entries(states).filter(([id, s]) => {
    if (!s.revealed) return false
    const q = questoes.find(q => q.id === id)
    return q && s.selected === q.correta
  }).length

  return (
    <div className="space-y-4">
      {genError && <p className="text-red-500 text-sm rounded-lg bg-red-50 px-3 py-2">{genError}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedDisc(null)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
            !selectedDisc ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Todas ({questoes.length})
        </button>
        {disciplinas.map(disc => {
          const count = questoes.filter(q => q.disciplina_id === disc.id).length
          return (
            <button
              key={disc.id}
              onClick={() => setSelectedDisc(disc.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                selectedDisc === disc.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {disc.nome} ({count})
            </button>
          )
        })}
      </div>

      {answered > 0 && (
        <div className="bg-slate-100 rounded-xl px-4 py-3 flex items-center gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Respondidas</span>
            <p className="font-bold text-slate-900 text-lg leading-none mt-0.5">{answered}</p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Corretas</span>
            <p className="font-bold text-emerald-600 text-lg leading-none mt-0.5">{correct}</p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Taxa</span>
            <p className="font-bold text-slate-900 text-lg leading-none mt-0.5">
              {Math.round((correct / answered) * 100)}%
            </p>
          </div>
        </div>
      )}

      {disciplinas.map(disc => {
        const discQuestoes = filtered.filter(q => q.disciplina_id === disc.id)
        if (selectedDisc && selectedDisc !== disc.id) return null

        return (
          <div key={disc.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">{disc.nome}</h3>
              <button
                onClick={() => handleGerar(disc.id, disc.nome)}
                disabled={generating === disc.id}
                className="rounded-lg border border-slate-200 text-slate-500 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
              >
                {generating === disc.id ? 'Gerando…' : '+ Gerar com IA'}
              </button>
            </div>

            {discQuestoes.length === 0 ? (
              <p className="text-slate-400 text-sm italic px-1">Nenhuma questão ainda.</p>
            ) : (
              discQuestoes.map((questao, idx) => (
                <QuestaoCard
                  key={questao.id}
                  questao={questao}
                  index={idx + 1}
                  state={getState(questao.id)}
                  onSelect={letra => handleSelect(questao, letra)}
                />
              ))
            )}
          </div>
        )
      })}
    </div>
  )
}

function QuestaoCard({
  questao,
  index,
  state,
  onSelect,
}: {
  questao: Questao
  index: number
  state: QuestaoState
  onSelect: (letra: string) => void
}) {
  const { selected, revealed } = state

  function getAltClass(alt: Alternativa) {
    const base = 'flex items-start gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-left transition focus:outline-none focus:ring-2 focus:ring-offset-1 '
    if (!revealed) {
      return base + 'border border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer focus:ring-blue-300'
    }
    if (alt.letra === questao.correta) {
      return base + 'border-2 border-emerald-400 bg-emerald-50 text-emerald-800 cursor-default focus:ring-emerald-300'
    }
    if (alt.letra === selected && alt.letra !== questao.correta) {
      return base + 'border-2 border-red-300 bg-red-50 text-red-700 cursor-default focus:ring-red-300'
    }
    return base + 'border border-slate-100 text-slate-400 cursor-default focus:ring-slate-200'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-2">
        Questão {index}
      </p>
      <p className="text-slate-900 text-sm leading-relaxed mb-4">{questao.enunciado}</p>

      <div className="space-y-2">
        {questao.alternativas.map(alt => (
          <button
            key={alt.letra}
            onClick={() => onSelect(alt.letra)}
            disabled={revealed}
            className={getAltClass(alt)}
          >
            <span className="font-mono font-bold text-[11px] flex-shrink-0 mt-0.5 w-4">{alt.letra}</span>
            <span className="leading-relaxed">{alt.texto}</span>
          </button>
        ))}
      </div>

      {revealed && questao.explicacao && (
        <div className="mt-4 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">Explicação</p>
          <p className="text-slate-600 text-sm leading-relaxed">{questao.explicacao}</p>
        </div>
      )}

      {revealed && (
        <div className={`mt-3 flex items-center gap-1.5 ${selected === questao.correta ? 'text-emerald-600' : 'text-red-500'}`}>
          {selected === questao.correta ? (
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
            </svg>
          )}
          <span className="font-mono text-[10px] uppercase tracking-widest">
            {selected === questao.correta ? 'Correto!' : `Errado — correta: ${questao.correta}`}
          </span>
        </div>
      )}
    </div>
  )
}
