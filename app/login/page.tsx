'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { t } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input, FieldError } from '@/components/ui/input'

const ThreeBackground = dynamic(() => import('@/components/ThreeBackground'), { ssr: false, loading: () => null })

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

  // Surface auth errors handed back by /auth/callback (?error=…) so a failed
  // Google/reset/confirmação flow shows a reason instead of silently looping.
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

  async function handleGoogle() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    })
    if (error) toast.error('Erro ao entrar com Google', error.message)
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

  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <ThreeBackground />

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <span className="font-mono text-3xl font-bold text-[#F1F5F9] tracking-tight">
            gabarito<span className="text-blue-500">_AI</span>
            <span className="inline-block w-2 h-6 bg-blue-500 ml-0.5 align-middle animate-blink" />
          </span>
          <p className="mt-2 text-[#475569] text-sm font-mono tracking-wide">console de estudos para concursos</p>

          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            {['Plano de Estudos', 'Flashcards', 'Questões IA'].map(f => (
              <span key={f} className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-[#2A2D3E] text-[#475569]">
                {f}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#1C1F2E]/90 backdrop-blur-md rounded-2xl border border-[#2A2D3E] p-6 shadow-2xl shadow-black/50 animate-glow"
        >
          {/* Tab switcher */}
          <div className="flex mb-6 bg-[#252836] rounded-lg p-1 gap-1">
            {(['login', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                  tab === t ? 'bg-[#1C1F2E] text-[#F1F5F9] shadow-sm' : 'text-[#475569] hover:text-[#94A3B8]'
                }`}
              >
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          {/* Google */}
          {tab !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full mb-3 flex items-center justify-center gap-2 h-10 rounded-lg bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                {t.auth.withGoogle}
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#2A2D3E]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#475569]">{t.auth.or}</span>
                <div className="flex-1 h-px bg-[#2A2D3E]" />
              </div>
            </>
          )}

          <motion.form
            key={tab}
            initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-3"
          >
            {/* Signup-only fields */}
            <AnimatePresence>
              {tab === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Nome *</label>
                      <Input
                        value={nome}
                        onChange={e => { setNome(e.target.value); clearError('nome') }}
                        aria-invalid={!!errors.nome}
                        placeholder="João"
                        className="h-9"
                      />
                      <FieldError>{errors.nome}</FieldError>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Sobrenome *</label>
                      <Input
                        value={sobrenome}
                        onChange={e => { setSobrenome(e.target.value); clearError('sobrenome') }}
                        aria-invalid={!!errors.sobrenome}
                        placeholder="Silva"
                        className="h-9"
                      />
                      <FieldError>{errors.sobrenome}</FieldError>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">País</label>
                      <Input value={pais} onChange={e => setPais(e.target.value)} placeholder="Brasil" className="h-9" />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Cidade</label>
                      <Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo" className="h-9" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Telefone</label>
                    <Input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" className="h-9" />
                  </div>

                  <div className="border-t border-[#2A2D3E] pt-1" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Common fields */}
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError('email') }}
                aria-invalid={!!errors.email}
                placeholder="seu@email.com"
                className="h-10"
              />
              <FieldError>{errors.email}</FieldError>
            </div>
            {tab !== 'forgot' && (
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError('password') }}
                  aria-invalid={!!errors.password}
                  placeholder="••••••••"
                  className="h-10"
                />
                <FieldError>{errors.password}</FieldError>
                {tab === 'signup' && !errors.password && (
                  <p className="text-[11px] text-[#475569] mt-1">Mínimo 6 caracteres.</p>
                )}
                {tab === 'login' && (
                  <button type="button" onClick={() => switchTab('forgot')} className="text-[11px] text-blue-400 hover:text-blue-300 mt-1.5 cursor-pointer">
                    {t.auth.forgotPassword}
                  </button>
                )}
              </div>
            )}

            {tab === 'forgot' && (
              <button type="button" onClick={() => switchTab('login')} className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
                ← Voltar para entrar
              </button>
            )}

            <Button type="submit" disabled={loading} className="w-full h-10 mt-1" size="lg">
              {loading ? 'Aguarde…' : tab === 'login' ? t.auth.signIn : tab === 'signup' ? t.auth.signUp : t.auth.resetPassword}
            </Button>
          </motion.form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center font-mono text-[10px] uppercase tracking-widest text-[#2A2D3E] mt-6"
        >
          gabarito_AI · {new Date().getFullYear()}
        </motion.p>
      </div>
    </div>
  )
}
