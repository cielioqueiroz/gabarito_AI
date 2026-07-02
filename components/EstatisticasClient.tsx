'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import ShellLayout from './ShellLayout'
import ProgressBar from './ProgressBar'
import { EmptyIllustration } from './ui/EmptyIllustration'

interface Resposta { acertou: boolean; respondido_em: string; concurso_id: string | null }
interface DiscStat { disciplina_id: string; concurso_id?: string; nome: string; respostas_total: number; respostas_corretas: number }
interface ConcursoStat { concurso_id: string; topicos_total: number; topicos_estudados: number; flashcards_total: number; flashcards_dominados: number }
interface Concurso { id: string; nome: string }

interface Props { respostas: Resposta[]; disciplinaStats: DiscStat[]; concursoStats: ConcursoStat[]; concursos: Concurso[] }

export default function EstatisticasClient({ respostas: allResp, disciplinaStats: allDisc, concursoStats: allConcursoStats, concursos }: Props) {
  const [filterConcurso, setFilterConcurso] = useState<string | null>(null)

  const respostas = useMemo(() =>
    filterConcurso ? allResp.filter(r => r.concurso_id === filterConcurso) : allResp,
  [allResp, filterConcurso])

  const disciplinaStats = useMemo(() =>
    filterConcurso ? allDisc.filter(d => d.concurso_id === filterConcurso) : allDisc,
  [allDisc, filterConcurso])

  const concursoStats = useMemo(() =>
    filterConcurso ? allConcursoStats.filter(c => c.concurso_id === filterConcurso) : allConcursoStats,
  [allConcursoStats, filterConcurso])

  const totalResp = respostas.length
  const corretas = respostas.filter(r => r.acertou).length
  const taxa = totalResp === 0 ? 0 : Math.round((corretas / totalResp) * 100)

  const now = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const dia = respostas.filter(r => r.respondido_em.slice(0, 10) === key)
    return { key, label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3), total: dia.length, corretas: dia.filter(r => r.acertou).length }
  })
  const maxDia = Math.max(1, ...last7.map(d => d.total))

  const totTopicos    = concursoStats.reduce((a, c) => a + Number(c.topicos_total), 0)
  const totEstudados  = concursoStats.reduce((a, c) => a + Number(c.topicos_estudados), 0)
  const totCards      = concursoStats.reduce((a, c) => a + Number(c.flashcards_total), 0)
  const totDominados  = concursoStats.reduce((a, c) => a + Number(c.flashcards_dominados), 0)

  if (totalResp === 0 && allConcursoStats.length === 0) {
    return (
      <ShellLayout title="Estatísticas">
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <EmptyIllustration variant="chart" className="mb-5 text-muted-foreground" />
          <h2 className="font-bold text-foreground text-lg mb-2">Sem dados ainda</h2>
          <p className="text-muted-foreground text-sm">Estude flashcards e responda questões para ver estatísticas aqui.</p>
        </div>
      </ShellLayout>
    )
  }

  return (
    <ShellLayout title="Estatísticas">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {concursos.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterConcurso(null)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer ${!filterConcurso ? 'bg-amber-600 text-white' : 'bg-elevated text-muted hover:bg-border'}`}
            >
              Todos ({concursos.length})
            </button>
            {concursos.map(c => (
              <button
                key={c.id}
                onClick={() => setFilterConcurso(c.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer ${filterConcurso === c.id ? 'bg-amber-600 text-white' : 'bg-elevated text-muted hover:bg-border'}`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        )}

        {/* KPIs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3 sm:gap-4">
          <Card><CardContent className="pt-4 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Questões</p>
            <p className="text-2xl font-bold text-foreground">{totalResp}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Acertos</p>
            <p className="text-2xl font-bold text-emerald-500">{corretas}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Taxa</p>
            <p className="text-2xl font-bold text-foreground">{taxa}%</p>
          </CardContent></Card>
        </motion.div>

        {/* Progresso geral */}
        <Card><CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Progresso geral</h3>
          <ProgressBar value={totEstudados} max={totTopicos} color="blue" label={`Plano · ${totEstudados}/${totTopicos} tópicos`} showPercent />
          <ProgressBar value={totDominados} max={totCards}   color="emerald" label={`Domínio · ${totDominados}/${totCards} cards`} showPercent />
        </CardContent></Card>

        {/* Últimos 7 dias */}
        <Card><CardContent className="pt-5">
          <h3 className="font-semibold text-foreground text-sm mb-4">Últimos 7 dias</h3>
          <div className="flex items-end gap-3 h-32">
            {last7.map(d => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex flex-col justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.total / maxDia) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="w-full bg-amber-500/30 rounded-t"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: d.total > 0 ? `${(d.corretas / d.total) * 100}%` : '0%' }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                      className="w-full bg-emerald-500 rounded-t"
                    />
                  </motion.div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{d.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{d.total}</span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-3">Verde = acertos · Azul = respostas</p>
        </CardContent></Card>

        {/* Por disciplina */}
        {disciplinaStats.filter(d => d.respostas_total > 0).length > 0 && (
          <Card><CardContent className="pt-5">
            <h3 className="font-semibold text-foreground text-sm mb-4">Desempenho por disciplina</h3>
            <div className="space-y-3">
              {disciplinaStats
                .filter(d => d.respostas_total > 0)
                .sort((a, b) => b.respostas_total - a.respostas_total)
                .map(d => {
                  const pct = Math.round((Number(d.respostas_corretas) / Number(d.respostas_total)) * 100)
                  return (
                    <div key={d.disciplina_id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted">{d.nome}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {d.respostas_corretas}/{d.respostas_total} · {pct}%
                        </span>
                      </div>
                      <ProgressBar value={Number(d.respostas_corretas)} max={Number(d.respostas_total)} color={pct >= 70 ? 'emerald' : pct >= 50 ? 'amber' : 'blue'} size="sm" />
                    </div>
                  )
                })}
            </div>
          </CardContent></Card>
        )}
      </div>
    </ShellLayout>
  )
}
