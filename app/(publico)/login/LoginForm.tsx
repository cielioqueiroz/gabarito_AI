'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useMotion } from '@/lib/motion'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { FieldError, Input } from '@/components/ui/input'

type Tab = 'login' | 'signup' | 'forgot'
type Errors = Record<string, string>

function GoogleIcon() {
  return (
    <svg aria-hidden width="17" height="17" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59A14 14 0 019.77 24c0-1.6.27-3.14.76-4.59l-7.98-6.19A24 24 0 000 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg aria-hidden width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58A12 12 0 0024 12.5C24 5.87 18.63.5 12 .5z" />
    </svg>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const toast = useToast()
  const { reduce } = useMotion()
  const [tab, setTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [pais, setPais] = useState('')
  const [cidade, setCidade] = useState('')
  const [telefone, setTelefone] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error')
    if (err) {
      toast.error('Não foi possível entrar', decodeURIComponent(err))
      window.history.replaceState({}, '', '/login')
    }
  }, [toast])

  function switchTab(next: Tab) {
    setTab(next)
    setErrors({})
    setShowPassword(false)
  }

  function clearError(field: string) {
    setErrors(previous => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
  }

  function validate(): boolean {
    const nextErrors: Errors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail.'
    else if (!emailPattern.test(email)) nextErrors.email = 'E-mail inválido.'
    if (tab !== 'forgot') {
      if (!password) nextErrors.password = 'Informe sua senha.'
      else if (password.length < 6) nextErrors.password = 'Use pelo menos 6 caracteres.'
    }
    if (tab === 'signup') {
      if (!nome.trim()) nextErrors.nome = 'Informe seu nome.'
      if (!sobrenome.trim()) nextErrors.sobrenome = 'Informe seu sobrenome.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    })
    if (error) {
      toast.error(`Erro ao entrar com ${provider === 'google' ? 'Google' : 'GitHub'}`, error.message)
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!validate()) {
      toast.warning('Verifique os campos', 'Há informações pendentes no formulário.')
      return
    }
    setLoading(true)
    const supabase = createClient()

    if (tab === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
      })
      if (error) toast.error('Não foi possível enviar', error.message)
      else {
        toast.success('Link enviado', 'Verifique seu e-mail para redefinir a senha.')
        setTab('login')
      }
      setLoading(false)
      return
    }

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) toast.error('Não foi possível entrar', 'E-mail ou senha incorretos.')
      else {
        toast.success('Bem-vindo de volta!')
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          data: {
            full_name: `${nome.trim()} ${sobrenome.trim()}`,
            first_name: nome.trim(),
            last_name: sobrenome.trim(),
            country: pais.trim() || null,
            city: cidade.trim() || null,
            phone: telefone.trim() || null,
          },
        },
      })
      if (error) toast.error('Erro ao criar conta', error.message)
      else {
        toast.success('Conta criada!', 'Verifique seu e-mail para confirmar o cadastro.')
        setTab('login')
      }
    }
    setLoading(false)
  }

  const title = tab === 'login' ? 'Continue de onde parou' : tab === 'signup' ? 'Comece sua preparação' : 'Recupere seu acesso'
  const description = tab === 'login'
    ? 'Entre para ver seu plano, revisões e progresso.'
    : tab === 'signup'
      ? 'Crie sua conta e transforme o próximo edital em rotina.'
      : 'Enviaremos um link seguro para o seu e-mail.'
  const submitLabel = loading ? 'Aguarde…' : tab === 'login' ? t.auth.signIn : tab === 'signup' ? t.auth.signUp : t.auth.resetPassword

  return (
    <div>
      <div className="mb-8">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.24em] text-[#7895EB]">
          {tab === 'login' ? 'Acesso ao console' : tab === 'signup' ? 'Novo candidato' : 'Segurança da conta'}
        </p>
        <h2 className="text-3xl font-bold tracking-[-0.045em] text-[#F4F4F0] sm:text-[2.15rem]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#898B95]">{description}</p>
      </div>

      {tab !== 'forgot' && (
        <div role="group" aria-label="Escolha como acessar" className="mb-7 grid grid-cols-2 border-b border-[#2B2D36]">
          {(['login', 'signup'] as const).map(item => (
            <button
              key={item}
              type="button"
              aria-pressed={tab === item}
              onClick={() => switchTab(item)}
              className={`relative min-h-11 px-3 pb-3 text-sm font-bold transition-colors ${tab === item ? 'text-[#F4F4F0]' : 'text-[#8D8F99] hover:text-[#C7C8CE]'}`}
            >
              {item === 'login' ? 'Entrar' : 'Criar conta'}
              {tab === item && <motion.span layoutId="auth-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-[#607FDF]" />}
            </button>
          ))}
        </div>
      )}

      {tab !== 'forgot' && (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button type="button" onClick={() => handleOAuth('google')} disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-[#30323C] bg-[#191A20] px-4 text-sm font-bold text-[#E8E8E5] transition-all hover:border-[#4A72E8]/50 hover:bg-[#1D1F27] disabled:opacity-50">
              <GoogleIcon /> Google
            </button>
            <button type="button" onClick={() => handleOAuth('github')} disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-[#30323C] bg-[#191A20] px-4 text-sm font-bold text-[#E8E8E5] transition-all hover:border-[#4A72E8]/50 hover:bg-[#1D1F27] disabled:opacity-50">
              <GithubIcon /> GitHub
            </button>
          </div>
          <div className="my-6 flex items-center gap-4" aria-hidden>
            <div className="h-px flex-1 bg-[#292B34]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#5F616B]">ou use seu e-mail</span>
            <div className="h-px flex-1 bg-[#292B34]" />
          </div>
        </>
      )}

      <motion.form key={tab} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.22 }} onSubmit={handleSubmit} noValidate className="space-y-4">
        <AnimatePresence initial={false}>
          {tab === 'signup' && (
            <motion.div initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={reduce ? undefined : { opacity: 0, height: 0 }} className="grid grid-cols-1 gap-3 overflow-hidden min-[420px]:grid-cols-2">
              <Field id="nome" label="Nome" icon={<UserRound size={16} />} error={errors.nome}>
                <Input id="nome" name="given-name" autoComplete="given-name" value={nome} onChange={event => { setNome(event.target.value); clearError('nome') }} aria-invalid={!!errors.nome} aria-describedby={errors.nome ? 'nome-error' : undefined} placeholder="Seu nome" className="h-12 bg-[#191A20] pl-10" />
              </Field>
              <Field id="sobrenome" label="Sobrenome" error={errors.sobrenome}>
                <Input id="sobrenome" name="family-name" autoComplete="family-name" value={sobrenome} onChange={event => { setSobrenome(event.target.value); clearError('sobrenome') }} aria-invalid={!!errors.sobrenome} aria-describedby={errors.sobrenome ? 'sobrenome-error' : undefined} placeholder="Sobrenome" className="h-12 bg-[#191A20]" />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field id="email" label="E-mail" icon={<Mail size={16} />} error={errors.email}>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={event => { setEmail(event.target.value); clearError('email') }} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} placeholder="voce@email.com" className="h-12 bg-[#191A20] pl-10" />
        </Field>

        {tab !== 'forgot' && (
          <Field id="password" label="Senha" icon={<LockKeyhole size={16} />} error={errors.password} action={tab === 'login' ? <button type="button" onClick={() => switchTab('forgot')} className="min-h-8 text-xs font-semibold text-[#A8BCF8] hover:text-white">Esqueci a senha</button> : undefined}>
            <div className="relative">
              <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={event => { setPassword(event.target.value); clearError('password') }} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : tab === 'signup' ? 'password-hint' : undefined} placeholder="••••••••" className="h-12 bg-[#191A20] pl-10 pr-12" />
              <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#72747F] transition-colors hover:text-[#F4F4F0]">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {tab === 'signup' && !errors.password && <p id="password-hint" className="mt-1.5 text-[11px] text-[#898B95]">Mínimo de 6 caracteres.</p>}
          </Field>
        )}

        {tab === 'signup' && (
          <details className="group rounded-xl border border-[#292B34] bg-[#15161B] px-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs font-semibold text-[#8D8F99] marker:hidden">
              Completar perfil <span className="font-normal text-[#898B95]">opcional</span>
              <ChevronDown size={15} className="ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-3 border-t border-[#292B34] pb-4 pt-4 sm:grid-cols-2">
              <Input name="country" autoComplete="country-name" value={pais} onChange={event => setPais(event.target.value)} placeholder="País" className="h-11 bg-[#191A20]" aria-label="País" />
              <Input name="city" autoComplete="address-level2" value={cidade} onChange={event => setCidade(event.target.value)} placeholder="Cidade" className="h-11 bg-[#191A20]" aria-label="Cidade" />
              <Input name="tel" type="tel" autoComplete="tel" value={telefone} onChange={event => setTelefone(event.target.value)} placeholder="Telefone" className="h-11 bg-[#191A20] sm:col-span-2" aria-label="Telefone" />
            </div>
          </details>
        )}

        {tab === 'forgot' && <button type="button" onClick={() => switchTab('login')} className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[#A8BCF8] hover:text-white"><ArrowLeft size={15} /> Voltar para entrar</button>}

        <Button type="submit" disabled={loading} size="lg" className="mt-2 h-12 w-full rounded-xl text-[15px]">
          {loading ? <LoaderCircle size={17} className="animate-spin motion-reduce:animate-none" /> : null}
          {submitLabel}
          {!loading && <ArrowRight size={17} />}
        </Button>
      </motion.form>

      <p className="mt-6 text-center text-[11px] leading-5 text-[#858792]">Seus dados ficam protegidos por autenticação segura e isolamento por usuário.</p>
    </div>
  )
}

function Field({ id, label, icon, error, action, children }: { id: string; label: string; icon?: React.ReactNode; error?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="mb-1.5 flex min-h-8 items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-bold text-[#BFC0C7]">{label}</label>
        {action}
      </div>
      <div className="relative">
        {icon ? <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#686A75]">{icon}</span> : null}
        {children}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  )
}
