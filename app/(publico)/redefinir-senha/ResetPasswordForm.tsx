'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { FieldError, Input } from '@/components/ui/input'

type FieldName = 'password' | 'confirmar'
type Errors = Partial<Record<FieldName, string>>

const requisitos = [
  { label: '6 ou mais caracteres', test: (value: string) => value.length >= 6 },
  { label: 'uma letra', test: (value: string) => /[A-Za-zÀ-ÿ]/.test(value) },
  { label: 'um número', test: (value: string) => /\d/.test(value) },
]

export default function ResetPasswordForm() {
  const router = useRouter()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  function clearError(field: FieldName) {
    setErrors(previous => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  function validate(): boolean {
    const nextErrors: Errors = {}
    if (!password) nextErrors.password = 'Informe a nova senha.'
    else if (password.length < 6) nextErrors.password = 'Use pelo menos 6 caracteres.'
    else if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) nextErrors.password = 'Inclua pelo menos uma letra e um número.'
    if (!confirmar) nextErrors.confirmar = 'Confirme a nova senha.'
    else if (password !== confirmar) nextErrors.confirmar = 'As senhas não coincidem.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!validate()) {
      toast.warning('Verifique os campos', 'A nova senha ainda não está pronta.')
      return
    }

    setLoading(true)
    const { error } = await createClient().auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error('Não foi possível redefinir', error.message)
      return
    }

    toast.success('Senha redefinida', 'Você já pode continuar seus estudos.')
    router.push('/')
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.24em] text-brand">Última etapa</p>
        <h2 className="text-3xl font-bold tracking-[-0.045em] text-foreground sm:text-[2.15rem]">Crie sua nova senha</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Escolha uma senha que você ainda não usa em outros serviços.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <PasswordField
          id="nova-senha"
          label="Nova senha"
          value={password}
          showPassword={showPassword}
          error={errors.password}
          describedBy={errors.password ? 'nova-senha-error' : 'password-requirements'}
          onChange={value => {
            setPassword(value)
            clearError('password')
          }}
          onToggle={() => setShowPassword(value => !value)}
        />

        <div id="password-requirements" className="grid gap-2 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
          {requisitos.map(requisito => {
            const passed = requisito.test(password)
            return (
              <span key={requisito.label} className={`flex items-center gap-2 text-[11px] ${passed ? 'text-emerald-300' : 'text-muted-foreground'}`}>
                <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${passed ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-border'}`}>
                  {passed ? <Check size={10} /> : null}
                </span>
                {requisito.label}
              </span>
            )
          })}
        </div>

        <PasswordField
          id="confirmar-senha"
          label="Confirmar nova senha"
          value={confirmar}
          showPassword={showPassword}
          error={errors.confirmar}
          describedBy={errors.confirmar ? 'confirmar-senha-error' : undefined}
          onChange={value => {
            setConfirmar(value)
            clearError('confirmar')
          }}
          onToggle={() => setShowPassword(value => !value)}
        />

        <Button type="submit" disabled={loading} size="lg" className="mt-2 h-12 w-full rounded-md text-[15px]">
          {loading ? <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" /> : <LockKeyhole size={17} />}
          {loading ? 'Salvando…' : 'Salvar e continuar'}
          {!loading ? <ArrowRight size={17} /> : null}
        </Button>
      </form>

      <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">
        Se o link tiver expirado, solicite uma nova recuperação na tela de login.
      </p>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  showPassword,
  error,
  describedBy,
  onChange,
  onToggle,
}: {
  id: string
  label: string
  value: string
  showPassword: boolean
  error?: string
  describedBy?: string
  onChange: (value: string) => void
  onToggle: () => void
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold text-foreground">{label}</label>
      <div className="relative">
        <LockKeyhole aria-hidden size={16} className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          name={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={event => onChange(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          placeholder="••••••••"
          className="h-12 bg-elevated pl-10 pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={showPassword}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}
