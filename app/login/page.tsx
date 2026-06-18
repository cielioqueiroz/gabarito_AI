'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ThreeBackground from '@/components/ThreeBackground'

type Tab = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')

  // Login fields
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // Signup-only fields
  const [nome, setNome]         = useState('')
  const [sobrenome, setSobrenome] = useState('')
  const [pais, setPais]         = useState('')
  const [cidade, setCidade]     = useState('')
  const [telefone, setTelefone] = useState('')

  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  function switchTab(t: Tab) {
    setTab(t)
    setError(''); setSuccess('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    const supabase = createClient()

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else { router.push('/'); router.refresh() }
    } else {
      if (!nome.trim() || !sobrenome.trim()) {
        setError('Nome e sobrenome são obrigatórios.')
        setLoading(false); return
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name:  `${nome.trim()} ${sobrenome.trim()}`,
            first_name: nome.trim(),
            last_name:  sobrenome.trim(),
            country:    pais.trim() || null,
            city:       cidade.trim() || null,
            phone:      telefone.trim() || null,
          },
        },
      })
      if (error) setError(error.message)
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <ThreeBackground />

      {/* Gradient lines */}
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
                  tab === t
                    ? 'bg-[#1C1F2E] text-[#F1F5F9] shadow-sm'
                    : 'text-[#475569] hover:text-[#94A3B8]'
                }`}
              >
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <motion.form
            key={tab}
            initial={{ opacity: 0, x: tab === 'login' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
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
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">
                        Nome *
                      </label>
                      <Input
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        required={tab === 'signup'}
                        placeholder="João"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">
                        Sobrenome *
                      </label>
                      <Input
                        value={sobrenome}
                        onChange={e => setSobrenome(e.target.value)}
                        required={tab === 'signup'}
                        placeholder="Silva"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">
                        País
                      </label>
                      <Input
                        value={pais}
                        onChange={e => setPais(e.target.value)}
                        placeholder="Brasil"
                        className="h-9"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">
                        Cidade
                      </label>
                      <Input
                        value={cidade}
                        onChange={e => setCidade(e.target.value)}
                        placeholder="São Paulo"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">
                      Telefone
                    </label>
                    <Input
                      type="tel"
                      value={telefone}
                      onChange={e => setTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="h-9"
                    />
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
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="h-10"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="h-10"
              />
              {tab === 'signup' && (
                <p className="text-[11px] text-[#475569] mt-1">Mínimo 6 caracteres.</p>
              )}
            </div>

            {error   && <p className="text-red-400 text-sm rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>}
            {success && <p className="text-emerald-400 text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">{success}</p>}

            <Button type="submit" disabled={loading} className="w-full h-10 mt-1" size="lg">
              {loading ? 'Aguarde…' : tab === 'login' ? 'Entrar' : 'Criar conta'}
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
