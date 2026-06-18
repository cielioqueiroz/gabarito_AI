'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import ConcursoCard from './ConcursoCard'
import ShellLayout from './ShellLayout'
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
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

export default function HomeClient({ stats, userEmail }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome]   = useState('')
  const [cargo, setCargo] = useState('')
  const [banca, setBanca] = useState('')
  const [ano, setAno]     = useState('')
  const [file, setFile]   = useState<File | null>(null)
  const [loading, setLoading]     = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError]         = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetForm() {
    setNome(''); setCargo(''); setBanca(''); setAno(''); setFile(null)
    setShowForm(false); setError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true); setError('')
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
        if (!res.ok) throw new Error(data.error ?? 'Erro ao criar concurso')
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
        resetForm(); router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
    setLoading(false); setLoadingMsg('')
  }

  async function handleDelete(id: string) {
    await createClient().from('concursos').delete().eq('id', id)
    router.refresh()
  }

  const totalTopicos   = stats.reduce((a, s) => a + s.topicoEstudados, 0)
  const totalDominados = stats.reduce((a, s) => a + s.flashcardDominados, 0)

  const headerRight = (
    <Button onClick={() => setShowForm(v => !v)} size="sm">
      <Plus size={14} />
      Novo concurso
    </Button>
  )

  return (
    <ShellLayout title="Dashboard" headerRight={headerRight}>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: 'Concursos',       value: stats.length,   color: 'text-[#F1F5F9]' },
            { label: 'Tópicos estudados', value: totalTopicos,  color: 'text-blue-400'   },
            { label: 'Cards dominados',   value: totalDominados, color: 'text-emerald-400' },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            >
              <Card className="hover:border-[#3D4158] transition-colors">
                <CardContent className="pt-4 pb-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
                    <h2 className="font-semibold text-[#F1F5F9]">Novo concurso</h2>
                    <button onClick={resetForm} className="text-[#475569] hover:text-[#94A3B8] cursor-pointer transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Nome *</label>
                      <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="ex.: Banco do Brasil 2025" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Cargo</label>
                        <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="ex.: Agente de TI" />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Banca</label>
                        <Input value={banca} onChange={e => setBanca(e.target.value)} placeholder="ex.: Cesgranrio" />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Ano</label>
                        <Input value={ano} onChange={e => setAno(e.target.value)} placeholder="ex.: 2025" />
                      </div>
                    </div>

                    {/* Upload area */}
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[#475569] mb-1.5">Edital (PDF ou TXT) — opcional</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const d = e.dataTransfer.files[0]; if (d) setFile(d) }}
                        className={`w-full rounded-lg border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-all duration-150 ${
                          file ? 'border-blue-500/50 bg-blue-500/5' : 'border-[#2A2D3E] hover:border-blue-500/30 hover:bg-[#252836]'
                        }`}
                      >
                        {file ? (
                          <div className="flex items-center justify-center gap-2">
                            <Upload size={14} className="text-blue-400 flex-shrink-0" />
                            <span className="text-sm text-blue-400 font-medium truncate max-w-xs">{file.name}</span>
                            <button type="button" onClick={ev => { ev.stopPropagation(); setFile(null) }} className="text-[#475569] hover:text-red-400 ml-1 cursor-pointer transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload size={20} className="text-[#2A2D3E] mx-auto mb-1.5" />
                            <p className="text-xs text-[#475569]">Arraste o edital ou clique para selecionar</p>
                            <p className="font-mono text-[10px] uppercase tracking-widest text-[#2A2D3E] mt-0.5">PDF ou TXT</p>
                          </div>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                      {file && <p className="text-[11px] text-blue-400 mt-1.5">A IA vai organizar o edital em disciplinas e tópicos ao criar</p>}
                    </div>

                    {error && (
                      <p className="text-red-400 text-sm rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>
                    )}
                    {loading && loadingMsg && (
                      <div className="flex items-center gap-2 text-blue-400 text-sm">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1C1F2E] border border-[#2A2D3E] mb-5">
              <BookOpenIcon />
            </div>
            <p className="text-[#475569] text-sm mb-4">Nenhum concurso cadastrado ainda.</p>
            <button onClick={() => setShowForm(true)} className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors cursor-pointer">
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
    </ShellLayout>
  )
}

function BookOpenIcon() {
  return (
    <svg className="w-6 h-6 text-[#475569]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783" />
    </svg>
  )
}
