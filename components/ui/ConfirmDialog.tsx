'use client'

import { useState, useEffect } from 'react'
import { Dialog } from './dialog'
import { Button } from './button'
import { Input } from './input'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  requireTypedName?: string
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive,
  requireTypedName,
}: Props) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (open) setTyped('') }, [open])

  const canConfirm = requireTypedName ? typed.trim() === requireTypedName.trim() : true

  async function handleConfirm() {
    if (!canConfirm) return
    setBusy(true)
    try { await onConfirm() } finally { setBusy(false); onClose() }
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      {requireTypedName && (
        <div className="mb-4">
          <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
            Digite <span className="text-foreground font-semibold">{requireTypedName}</span> para confirmar
          </label>
          <Input value={typed} onChange={e => setTyped(e.target.value)} placeholder={requireTypedName} />
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
        <Button
          variant={destructive ? 'destructive' : 'default'}
          disabled={!canConfirm || busy}
          onClick={handleConfirm}
        >
          {busy ? 'Processando…' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
