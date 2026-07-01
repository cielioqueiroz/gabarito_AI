'use client'

import { useState } from 'react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface Props {
  open: boolean
  onClose: () => void
  disciplinaId: string
  disciplinaNome: string
  onCreated: () => void
}

export function FlashcardManualDialog({ open, onClose, disciplinaId, disciplinaNome, onCreated }: Props) {
  const [frente, setFrente] = useState('')
  const [verso, setVerso] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!frente.trim() || !verso.trim()) { setError('Frente e verso são obrigatórios.'); return }
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaId, frente, verso }),
      })
      if (!res.ok) throw new Error(await res.text())
      setFrente(''); setVerso('')
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar card')
    } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Novo flashcard" description={`Disciplina: ${disciplinaNome}`}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Frente (pergunta)</label>
          <Input value={frente} onChange={e => setFrente(e.target.value)} placeholder="Ex: O que é habeas corpus?" />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Verso (resposta)</label>
          <textarea
            value={verso}
            onChange={e => setVerso(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            placeholder="Ex: Remédio constitucional que protege o direito de ir e vir…"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Criando…' : 'Criar card'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
