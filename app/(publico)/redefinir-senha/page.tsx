'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input, FieldError } from '@/components/ui/input'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const toast  = useToast()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setError('')
    if (password.length < 6) return setError('Mínimo 6 caracteres.')
    if (password !== confirmar) return setError('As senhas não coincidem.')

    setLoading(true)
    const { error: err } = await createClient().auth.updateUser({ password })
    setLoading(false)
    if (err) {
      toast.error('Erro ao redefinir', err.message)
      return
    }
    toast.success('Senha redefinida!', 'Você já pode entrar.')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#1C1F2E]/90 backdrop-blur-md rounded-2xl border border-[#2A2D3E] p-6 shadow-2xl">
        <h1 className="font-bold text-foreground text-lg mb-1">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground mb-4">Escolha uma nova senha para sua conta.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Nova senha</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Confirmar</label>
            <Input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="••••••••" />
            <FieldError>{error}</FieldError>
          </div>
          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
