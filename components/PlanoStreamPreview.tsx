'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

interface Props {
  concursoId: string
  texto: string
  onComplete: () => void
  onCancel: () => void
}

interface Disciplina { nome: string; topicos: string[] }

function parseStream(buffer: string): Disciplina[] {
  const lines = buffer.split('\n')
  const disciplinas: Disciplina[] = []
  for (const line of lines) {
    if (line.startsWith('# ')) {
      disciplinas.push({ nome: line.slice(2).trim(), topicos: [] })
    } else if (line.startsWith('- ')) {
      const last = disciplinas[disciplinas.length - 1]
      if (last) last.topicos.push(line.slice(2).trim())
    }
  }
  return disciplinas
}

export function PlanoStreamPreview({ concursoId, texto, onComplete, onCancel }: Props) {
  const [running, setRunning] = useState(false)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savingFinal, setSavingFinal] = useState(false)

  async function start() {
    setRunning(true); setError(null); setDisciplinas([])
    try {
      const res = await fetch('/api/stream-plano', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, concursoId }),
      })
      if (res.status === 429) { setError('Muitas requisições. Aguarde alguns segundos.'); setRunning(false); return }
      if (!res.ok || !res.body) { setError('Erro ao gerar plano.'); setRunning(false); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        setDisciplinas(parseStream(buf))
      }
      setRunning(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
      setRunning(false)
    }
  }

  async function persist() {
    setSavingFinal(true)
    // Fallback: chama gerar-plano estruturado para gravar de forma canônica
    try {
      await fetch('/api/gerar-plano', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, concursoId }),
      })
      onComplete()
    } finally { setSavingFinal(false) }
  }

  return (
    <Card>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Sparkles size={14} className="text-blue-500" />
              Preview do plano (streaming)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Veja disciplinas aparecerem em tempo real. Confirme para salvar.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={running || savingFinal}>Cancelar</Button>
        </div>

        {!running && disciplinas.length === 0 && !error && (
          <Button onClick={start} className="w-full"><Sparkles size={14} /> Iniciar preview</Button>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {(running || disciplinas.length > 0) && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <AnimatePresence initial={false}>
              {disciplinas.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-lg border border-border bg-elevated px-3 py-2"
                >
                  <p className="text-sm font-semibold text-foreground">{d.nome}</p>
                  <ul className="mt-1 text-xs text-muted space-y-0.5">
                    {d.topicos.map((t, j) => <li key={j} className="truncate">• {t}</li>)}
                  </ul>
                </motion.div>
              ))}
            </AnimatePresence>
            {running && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                gerando…
              </div>
            )}
          </div>
        )}

        {!running && disciplinas.length > 0 && !error && (
          <Button onClick={persist} disabled={savingFinal} className="w-full">
            {savingFinal ? 'Salvando plano…' : `Confirmar e salvar (${disciplinas.length} disciplinas)`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
