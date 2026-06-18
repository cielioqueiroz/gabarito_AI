'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Palette, Sun, Moon, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/lib/theme'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input, FieldError } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import ShellLayout from './ShellLayout'

interface Props {
  userId: string
  email: string
  initialName: string
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export default function ConfiguracoesClient({ email, initialName }: Props) {
  const { theme, toggle } = useTheme()
  const toast = useToast()
  const [displayName, setDisplayName] = useState(initialName)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [nameError, setNameError] = useState('')

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) {
      setNameError('Informe um nome de exibição.')
      toast.warning('Nome obrigatório')
      return
    }
    setSaving(true); setNameError(''); setSaved(false)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      })
      if (error) throw new Error(error.message)
      setSaved(true)
      toast.success('Perfil atualizado', 'Seu nome foi salvo com sucesso.')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      toast.error('Erro ao salvar', err instanceof Error ? err.message : 'Tente novamente.')
    }
    setSaving(false)
  }

  return (
    <ShellLayout title="Configurações">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >

          {/* Perfil */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>Seu nome e endereço de e-mail.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveName} noValidate className="space-y-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
                      Nome de exibição
                    </label>
                    <Input
                      value={displayName}
                      onChange={e => { setDisplayName(e.target.value); if (nameError) setNameError('') }}
                      aria-invalid={!!nameError}
                      placeholder="Como quer ser chamado?"
                    />
                    <FieldError>{nameError}</FieldError>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
                      E-mail
                    </label>
                    <Input value={email} disabled className="opacity-60 cursor-not-allowed" />
                    <p className="text-[11px] text-muted-foreground mt-1">O e-mail não pode ser alterado aqui.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={saving} size="sm">
                      {saving
                        ? <><Loader2 size={14} className="animate-spin" /> Salvando…</>
                        : saved
                        ? <><Check size={14} /> Salvo</>
                        : 'Salvar nome'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Aparência */}
          <motion.div variants={fadeUp}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Palette size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <CardTitle>Aparência</CardTitle>
                    <CardDescription>Escolha entre modo escuro e claro.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {/* Dark card */}
                  <button
                    onClick={() => theme === 'light' && toggle()}
                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-150 text-left ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-border hover:border-blue-500/40'
                    }`}
                  >
                    <div className="w-full aspect-video rounded-lg bg-[#0F1117] mb-3 overflow-hidden p-2">
                      <div className="h-2 w-16 rounded-full bg-[#2A2D3E] mb-2" />
                      <div className="h-1.5 w-full rounded-full bg-[#1C1F2E]" />
                      <div className="h-1.5 w-3/4 rounded-full bg-[#1C1F2E] mt-1" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Moon size={14} className="text-muted" />
                      <span className="text-sm font-medium text-foreground">Modo escuro</span>
                    </div>
                    {theme === 'dark' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>

                  {/* Light card */}
                  <button
                    onClick={() => theme === 'dark' && toggle()}
                    className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-150 text-left ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-border hover:border-blue-500/40'
                    }`}
                  >
                    <div className="w-full aspect-video rounded-lg bg-white mb-3 overflow-hidden p-2 border border-slate-100">
                      <div className="h-2 w-16 rounded-full bg-slate-200 mb-2" />
                      <div className="h-1.5 w-full rounded-full bg-slate-100" />
                      <div className="h-1.5 w-3/4 rounded-full bg-slate-100 mt-1" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun size={14} className="text-muted" />
                      <span className="text-sm font-medium text-foreground">Modo claro</span>
                    </div>
                    {theme === 'light' && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

        </motion.div>
      </div>
    </ShellLayout>
  )
}
