'use client'

import { useState } from 'react'
import { FileText, Link2, Video, Sparkles } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useToast } from '@/lib/toast'
import type { Disciplina } from '@/types'

type SourceType = 'text' | 'url' | 'youtube'

const TABS: { key: SourceType; label: string; icon: typeof FileText }[] = [
  { key: 'text', label: 'Texto', icon: FileText },
  { key: 'url', label: 'Link', icon: Link2 },
  { key: 'youtube', label: 'YouTube', icon: Video },
]

interface Props {
  open: boolean
  onClose: () => void
  disciplinas: Disciplina[]
  onGenerated: () => void
}

export function SourceResumoDialog({ open, onClose, disciplinas, onGenerated }: Props) {
  const toast = useToast()
  const [discId, setDiscId] = useState(disciplinas[0]?.id ?? '')
  const [type, setType] = useState<SourceType>('text')
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  const placeholder =
    type === 'text' ? 'Cole aqui o texto, matéria ou anotação…'
    : type === 'url' ? 'https://exemplo.com/artigo'
    : 'https://youtube.com/watch?v=…'

  async function handle() {
    const disc = disciplinas.find(d => d.id === discId)
    if (!disc) return toast.warning('Escolha uma disciplina')
    if (!value.trim()) return toast.warning('Informe a fonte', 'Cole o texto ou o link.')
    setBusy(true)
    try {
      const res = await fetch('/api/gerar-resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaId: disc.id, disciplinaNome: disc.nome, source: { type, value: value.trim() } }),
      })
      if (res.status === 429) throw new Error('Muitas requisições. Aguarde alguns segundos.')
      if (!res.ok) throw new Error(await res.text().then(t => { try { return JSON.parse(t).error } catch { return t } }))
      toast.success('Resumo gerado!', `Adicionado em ${disc.nome}.`)
      setValue('')
      onGenerated()
      onClose()
    } catch (err: unknown) {
      toast.error('Não foi possível gerar', err instanceof Error ? err.message : 'Tente novamente.')
    }
    setBusy(false)
  }

  return (
    <Dialog open={open} onClose={onClose} title="Gerar resumo de uma fonte" description="Cole um texto, um link de artigo ou um vídeo do YouTube — a IA resume para você.">
      <div className="space-y-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Salvar na disciplina</p>
          <select
            value={discId}
            onChange={e => setDiscId(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-elevated px-3 text-sm text-foreground outline-none focus:border-blue-500/40 cursor-pointer"
          >
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>

        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Fonte</p>
          <div className="mb-3 flex gap-1 rounded-lg bg-elevated p-1">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                    type === t.key ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-muted'
                  }`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              )
            })}
          </div>

          {type === 'text' ? (
            <textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={placeholder}
              rows={6}
              className="w-full resize-y rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-blue-500/40"
            />
          ) : (
            <Input value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} className="h-10" />
          )}
          {type === 'youtube' && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">Funciona com vídeos que tenham legendas/transcrição.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={handle} disabled={busy || !value.trim()}>
            <Sparkles size={14} />
            {busy ? 'Gerando…' : 'Gerar resumo'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
