'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, X, BookOpen, Target, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input, FieldError } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import ConcursoCard from './ConcursoCard'
import ShellLayout from './ShellLayout'
import { OnboardingTour } from './OnboardingTour'
import { EmptyIllustration } from './ui/EmptyIllustration'
import type { Concurso } from '@/types'

interface ConcursoStat {
  concurso: Concurso
  topicoTotal: number
  topicoEstudados: number
  flashcardTotal: number
  flashcardDominados: number
}

interface Props {
  stats: ConcursoStat[]
  userEmail: string
  userName: string
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

function getFirstName(name: string, email: string): string {
  const raw = name || email.split('@')[0] || 'estudante'
  return raw.charAt(0).toUpperCase() + raw.slice(1).split(/[\s._-]/)[0]
}

export default function HomeClient({ stats, userEmail, userName }: Props) {
  const router = useRouter()
  const toast  = useToast()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome]   = useState('')
  const [cargo, setCargo] = useState('')
  const [banca, setBanca] = useState('')
  const [ano, setAno]     = useState('')
  const [file, setFile]   = useState<File | null>(null)
  const [loading, setLoading]     = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [nomeError, setNomeError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetForm() {
    setNome(''); setCargo(''); setBanca(''); setAno(''); setFile(null)
    setShowForm(false); setNomeError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setNomeError('Informe o nome do concurso.')
      toast.warning('Nome obrigatório', 'Dê um nome ao concurso antes de criar.')
      return
    }
    setLoading(true); setNomeError('')
    try {
      if (file) {
        setLoadingMsg('Extraindo texto do edital…')
        const fd = new FormData()
        fd.append('nome', nome.trim())
        if (cargo.trim()) fd.append('cargo', cargo.trim())
        if (banca.trim()) fd.append('banca', banca.trim())
        if (ano.trim())   fd.append('ano', ano.trim())
        fd.append('edital', file)
        const res  = await fetch('/api/criar-com-edital', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.status === 429) throw new Error('Muitas requisições. Aguarde alguns segundos.')
        if (!res.ok) throw new Error(data.error ?? 'Erro ao criar concurso')
        toast.success('Concurso criado!', 'A IA organizou o edital em disciplinas.')
        resetForm()
        router.push(`/concurso/${data.id}`)
      } else {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('concursos').insert({
          nome: nome.trim(), cargo: cargo.trim() || null,
          banca: banca.trim() || null, ano: ano.trim() || null,
          user_id: user!.id,
        })
        if (error) throw new Error(error.message)
        toast.success('Concurso criado!')
        resetForm(); router.refresh()
      }
    } catch (err: unknown) {
      toast.error('Erro ao criar concurso', err instanceof Error ? err.message : 'Tente novamente.')
    }
    setLoading(false); setLoadingMsg('')
  }

  async function handleDelete(id: string) {
    await createClient().from('concursos').delete().eq('id', id)
    router.refresh()
  }

  const totalTopicos   = stats.reduce((a, s) => a + s.topicoEstudados, 0)
  const totalDominados = stats.reduce((a, s) => a + s.flashcardDominados, 0)
  const firstName = getFirstName(userName, userEmail)

  const headerRight = (
    <Button onClick={() => setShowForm(v => !v)} size="sm">
      <Plus size={14} />
      Novo concurso
    </Button>
  )

  return (
    <ShellLayout title="Dashboard" headerRight={headerRight}>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-foreground">
            Olá, {firstName} 👋
          </h2>
          <p className="text-sm text-muted mt-0.5">
            {stats.length === 0
              ? 'Comece adicionando seu primeiro concurso.'
              : `Você tem ${stats.length} concurso${stats.length > 1 ? 's' : ''} cadastrado${stats.length > 1 ? 's' : ''}.`}
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-3 sm:gap-4 mb-8"
        >
          {[
            { label: 'Concursos',         value: stats.length,   color: 'text-foreground', icon: BookOpen, iconCls: 'text-slate-300 bg-slate-500/10 border-slate-500/20' },
            { label: 'Tópicos estudados', value: totalTopicos,   color: 'text-[#F2D53C]',   icon: Target,   iconCls: 'text-[#F2D53C] bg-[#E9C92F]/10 border-[#E9C92F]/20' },
            { label: 'Cards dominados',   value: totalDominados, color: 'text-emerald-400', icon: Award,   iconCls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              >
                <Card className="hover:border-[#F2D53C]/30 transition-colors">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      </div>
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${s.iconCls}`}>
                        <Icon size={15} />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-foreground">Novo concurso</h2>
                    <button onClick={resetForm} className="text-muted-foreground hover:text-muted cursor-pointer transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleCreate} noValidate className="space-y-3">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Nome *</label>
                      <Input
                        value={nome}
                        onChange={e => { setNome(e.target.value); if (nomeError) setNomeError('') }}
                        aria-invalid={!!nomeError}
                        placeholder="ex.: Banco do Brasil 2025"
                      />
                      <FieldError>{nomeError}</FieldError>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Cargo</label>
                        <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="ex.: Agente de TI" />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Banca</label>
                        <Input value={banca} onChange={e => setBanca(e.target.value)} placeholder="ex.: Cesgranrio" />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Ano</label>
                        <Input value={ano} onChange={e => setAno(e.target.value)} placeholder="ex.: 2025" />
                      </div>
                    </div>

                    {/* Upload area */}
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Edital (PDF ou TXT) — opcional</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const d = e.dataTransfer.files[0]; if (d) setFile(d) }}
                        className={`w-full rounded-lg border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-all duration-150 ${
                          file
                            ? 'border-[#F2D53C]/50 bg-[#E9C92F]/5'
                            : 'border-border hover:border-[#F2D53C]/30 hover:bg-elevated'
                        }`}
                      >
                        {file ? (
                          <div className="flex items-center justify-center gap-2">
                            <Upload size={14} className="text-[#F2D53C] flex-shrink-0" />
                            <span className="text-sm text-[#F2D53C] font-medium truncate max-w-xs">{file.name}</span>
                            <button type="button" onClick={ev => { ev.stopPropagation(); setFile(null) }} className="text-muted-foreground hover:text-red-500 ml-1 cursor-pointer transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload size={20} className="text-border mx-auto mb-1.5" />
                            <p className="text-xs text-muted-foreground">Arraste o edital ou clique para selecionar</p>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">PDF ou TXT</p>
                          </div>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                      {file && <p className="text-[11px] text-[#F2D53C] mt-1.5">A IA vai organizar o edital em disciplinas e tópicos ao criar</p>}
                    </div>

                    {loading && loadingMsg && (
                      <div className="flex items-center gap-2 text-[#F2D53C] text-sm">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {loadingMsg}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? (file ? 'Processando edital…' : 'Salvando…') : (file ? 'Criar e gerar plano com IA' : 'Criar concurso')}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Concurso list */}
        {stats.length === 0 && !showForm ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <EmptyIllustration variant="books" className="mb-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-base mb-1">Comece pelo edital</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">Suba o PDF do edital e a IA organiza tudo — disciplinas, tópicos, flashcards e questões.</p>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 text-[#F2D53C] text-sm font-semibold hover:text-[#F2D53C] transition-colors cursor-pointer">
              Criar o primeiro concurso →
            </button>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {stats.map(s => (
              <ConcursoCard
                key={s.concurso.id}
                concurso={s.concurso}
                topicoTotal={s.topicoTotal}
                topicoEstudados={s.topicoEstudados}
                flashcardTotal={s.flashcardTotal}
                flashcardDominados={s.flashcardDominados}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}
      </div>
      <OnboardingTour />
    </ShellLayout>
  )
}
