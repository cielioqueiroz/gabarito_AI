'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Sparkles, GraduationCap, BrainCircuit, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input, FieldError } from '@/components/ui/input'

type Tab = 'login' | 'signup' | 'forgot'
type Errors = Record<string, string>

export default function LoginPage() {
  const router  = useRouter()
  const toast   = useToast()
  const [tab, setTab] = useState<Tab>('login')

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [nome, setNome]           = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [pais, setPais]           = useState('')
  const [cidade, setCidade]       = useState('')
  const [telefone, setTelefone]   = useState('')

  const [errors, setErrors]   = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get('error')
    if (err) {
      toast.error('Não foi possível entrar', decodeURIComponent(err))
      window.history.replaceState({}, '', '/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function switchTab(t: Tab) {
    setTab(t); setErrors({})
  }

  function clearError(field: string) {
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }; delete next[field]; return next
    })
  }

  function validate(): boolean {
    const e: Errors = {}
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim())             e.email = 'Informe seu e-mail.'
    else if (!emailRe.test(email)) e.email = 'E-mail inválido.'
    if (tab !== 'forgot') {
      if (!password)                 e.password = 'Informe sua senha.'
      else if (password.length < 6)  e.password = 'Mínimo de 6 caracteres.'
    }
    if (tab === 'signup') {
      if (!nome.trim())      e.nome = 'Informe seu nome.'
      if (!sobrenome.trim()) e.sobrenome = 'Informe seu sobrenome.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    })
    if (error) toast.error(`Erro ao entrar com ${provider === 'google' ? 'Google' : 'GitHub'}`, error.message)
    setLoading(false)
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
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
      if (error) toast.error('Erro', error.message)
      else {
        toast.success('E-mail enviado!', 'Verifique sua caixa para redefinir a senha.')
        setTab('login')
      }
      setLoading(false)
      return
    }

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error('Não foi possível entrar', 'E-mail ou senha incorretos.')
      } else {
        toast.success('Bem-vindo de volta!')
        router.push('/'); router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          data: {
            full_name:  `${nome.trim()} ${sobrenome.trim()}`,
            first_name: nome.trim(),
            last_name:  sobrenome.trim(),
            country:    pais.trim()     || null,
            city:       cidade.trim()   || null,
            phone:      telefone.trim() || null,
          },
        },
      })
      if (error) {
        toast.error('Erro ao criar conta', error.message)
      } else {
        toast.success('Conta criada!', 'Verifique seu e-mail para confirmar o cadastro.')
        setTab('login')
      }
    }
    setLoading(false)
  }

  const submitLabel = loading ? 'Aguarde…' : tab === 'login' ? t.auth.signIn : tab === 'signup' ? t.auth.signUp : t.auth.resetPassword

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-2">
      {/* ── Left brand panel ── */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0E1B33] via-[#132649] to-[#0B1526] p-12 lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          <div className="absolute -top-24 -left-16 h-96 w-96 rounded-full bg-amber-500/15 blur-[110px]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-500/12 blur-[120px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-500 shadow-lg shadow-amber-500/25">
            <GraduationCap size={20} className="text-white" />
          </span>
          <span className="font-mono text-lg font-bold tracking-tight">
            gabarito<span className="text-amber-400">_AI</span>
          </span>
          <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-300">
            <Sparkles size={10} /> IA
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
            Conquiste a sua<br />
            <span className="text-gradient-brand">Aprovação Pública</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-300">
            Suba o edital e deixe a IA montar seu plano, flashcards e questões. Estude com método e acompanhe cada avanço.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              { icon: BrainCircuit, text: 'Plano de estudos gerado a partir do edital' },
              { icon: Target, text: 'Repetição espaçada (Leitner) para fixar de vez' },
              { icon: Sparkles, text: 'Resumos, questões e podcast em voz neural' },
            ].map(f => {
              const Icon = f.icon
              return (
                <li key={f.text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10">
                    <Icon size={15} className="text-amber-400" />
                  </span>
                  {f.text}
                </li>
              )
            })}
          </ul>
        </div>

        <p className="relative z-10 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          gabarito_AI · console de estudos para concursos
        </p>
      </aside>

      {/* ── Right form panel ── */}
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-500">
              <GraduationCap size={18} className="text-white" />
            </span>
            <span className="font-mono text-lg font-bold tracking-tight">
              gabarito<span className="text-amber-400">_AI</span>
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {tab === 'login' ? 'Bem-vindo de volta' : tab === 'signup' ? 'Crie sua conta' : 'Recuperar senha'}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {tab === 'login' ? 'Entre para continuar seus estudos.' : tab === 'signup' ? 'Comece a estudar com IA hoje.' : 'Enviaremos um link para redefinir.'}
            </p>
          </div>

          {/* Tabs */}
          {tab !== 'forgot' && (
            <div className="mb-6 flex gap-1 rounded-xl border border-border bg-elevated/60 p-1">
              {(['login', 'signup'] as const).map(k => (
                <button
                  key={k}
                  onClick={() => switchTab(k)}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    tab === k ? 'bg-gradient-to-r from-amber-500/15 to-amber-500/10 text-amber-300 shadow-sm' : 'text-muted-foreground hover:text-muted'
                  }`}
                >
                  {k === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>
          )}

          {/* Social */}
          {tab !== 'forgot' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-elevated/40 text-sm font-semibold text-foreground transition-colors hover:border-amber-500/40 hover:bg-elevated disabled:opacity-50 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-elevated/40 text-sm font-semibold text-foreground transition-colors hover:border-amber-500/40 hover:bg-elevated disabled:opacity-50 cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58A12 12 0 0024 12.5C24 5.87 18.63.5 12 .5z"/></svg> GitHub
                </button>
              </div>
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t.auth.or}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <motion.form key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} onSubmit={handleSubmit} noValidate className="space-y-3">
            <AnimatePresence>
              {tab === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="space-y-3 overflow-hidden">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="relative">
                        <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input value={nome} onChange={e => { setNome(e.target.value); clearError('nome') }} aria-invalid={!!errors.nome} placeholder="Nome" className="h-11 pl-9" />
                      </div>
                      <FieldError>{errors.nome}</FieldError>
                    </div>
                    <div>
                      <Input value={sobrenome} onChange={e => { setSobrenome(e.target.value); clearError('sobrenome') }} aria-invalid={!!errors.sobrenome} placeholder="Sobrenome" className="h-11" />
                      <FieldError>{errors.sobrenome}</FieldError>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={pais} onChange={e => setPais(e.target.value)} placeholder="País" className="h-11" />
                    <Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Cidade" className="h-11" />
                  </div>
                  <Input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Telefone (opcional)" className="h-11" />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => { setEmail(e.target.value); clearError('email') }} aria-invalid={!!errors.email} placeholder="seu@email.com" className="h-11 pl-9" />
              </div>
              <FieldError>{errors.email}</FieldError>
            </div>

            {tab !== 'forgot' && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  {tab === 'login' && (
                    <button type="button" onClick={() => switchTab('forgot')} className="ml-auto cursor-pointer font-mono text-[10px] uppercase tracking-widest text-amber-400 transition-colors hover:text-amber-300">
                      {t.auth.forgotPassword}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" value={password} onChange={e => { setPassword(e.target.value); clearError('password') }} aria-invalid={!!errors.password} placeholder="••••••••" className="h-11 pl-9" />
                </div>
                <FieldError>{errors.password}</FieldError>
                {tab === 'signup' && !errors.password && <p className="mt-1 text-[11px] text-muted-foreground">Mínimo 6 caracteres.</p>}
              </div>
            )}

            {tab === 'forgot' && (
              <button type="button" onClick={() => switchTab('login')} className="cursor-pointer text-[11px] text-amber-400 hover:text-amber-300">← Voltar para entrar</button>
            )}

            <Button type="submit" disabled={loading} className="h-11 w-full text-[15px]" size="lg">
              {submitLabel}
              {!loading && tab === 'login' && <ArrowRight size={16} />}
            </Button>
          </motion.form>

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            gabarito_AI · {new Date().getFullYear()}
          </p>
        </div>
      </main>
    </div>
  )
}
