'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, X, BookOpen } from 'lucide-react'
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

export default function ConcursosClient({ stats }: { stats: ConcursoStat[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome]   = useState('')
  const [cargo, setCargo] = useState('')
  const [banca, setBanca] = useState('')
  const [ano, setAno]     = useState('')
  const [file, setFile]   = useState<File | null>(null)
  const [loading, setLoading]       = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError]           = useState('')
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

  const headerRight = (
    <Button onClick={() => setShowForm(v => !v)} size="sm">
      <Plus size={14} />
      Novo concurso
    </Button>
  )

  return (
    <ShellLayout title="Meus Concursos" headerRight={headerRight}>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Summary line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-[var(--c-muted)] mb-6"
        >
          {stats.length === 0
            ? 'Nenhum concurso cadastrado.'
            : `${stats.length} concurso${stats.length > 1 ? 's' : ''} — clique em um para ver detalhes.`}
        </motion.p>

        {/* Add form */}
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
                    <h2 className="font-semibold text-[var(--c-text)]">Novo concurso</h2>
                    <button onClick={resetForm} className="text-[var(--c-dimmed)] hover:text-[var(--c-muted)] cursor-pointer transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--c-dimmed)] mb-1.5">Nome *</label>
                      <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="ex.: Banco do Brasil 2025" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--c-dimmed)] mb-1.5">Cargo</label>
                        <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="ex.: Agente de TI" />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--c-dimmed)] mb-1.5">Banca</label>
                        <Input value={banca} onChange={e => setBanca(e.target.value)} placeholder="ex.: Cesgranrio" />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--c-dimmed)] mb-1.5">Ano</label>
                        <Input value={ano} onChange={e => setAno(e.target.value)} placeholder="ex.: 2025" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-[var(--c-dimmed)] mb-1.5">Edital (PDF ou TXT) — opcional</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const d = e.dataTransfer.files[0]; if (d) setFile(d) }}
                        className={`w-full rounded-lg border-2 border-dashed px-4 py-5 text-center cursor-pointer transition-all duration-150 ${
                          file
                            ? 'border-blue-500/50 bg-blue-500/5'
                            : 'border-[var(--c-border)] hover:border-blue-500/30 hover:bg-[var(--c-elevated)]'
                        }`}
                      >
                        {file ? (
                          <div className="flex items-center justify-center gap-2">
                            <Upload size={14} className="text-blue-500 flex-shrink-0" />
                            <span className="text-sm text-blue-500 font-medium truncate max-w-xs">{file.name}</span>
                            <button type="button" onClick={ev => { ev.stopPropagation(); setFile(null) }} className="text-[var(--c-dimmed)] hover:text-red-500 ml-1 cursor-pointer transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload size={20} className="text-[var(--c-dimmed)] mx-auto mb-1.5" />
                            <p className="text-xs text-[var(--c-dimmed)]">Arraste o edital ou clique para selecionar</p>
                          </div>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    </div>
                    {error && (
                      <p className="text-red-500 text-sm rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">{error}</p>
                    )}
                    {loading && loadingMsg && (
                      <div className="flex items-center gap-2 text-blue-500 text-sm">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {loadingMsg}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? (file ? 'Processando…' : 'Salvando…') : (file ? 'Criar com IA' : 'Criar concurso')}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {stats.length === 0 && !showForm ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--c-surface)] border border-[var(--c-border)] mb-5">
              <BookOpen size={22} className="text-[var(--c-dimmed)]" />
            </div>
            <p className="text-[var(--c-dimmed)] text-sm mb-4">Nenhum concurso cadastrado ainda.</p>
            <button onClick={() => setShowForm(true)} className="text-blue-500 text-sm font-semibold hover:text-blue-400 transition-colors cursor-pointer">
              Criar o primeiro concurso →
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {stats.map(s => (
              <motion.div
                key={s.concurso.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              >
                <ConcursoCard
                  concurso={s.concurso}
                  topicoTotal={s.topicoTotal}
                  topicoEstudados={s.topicoEstudados}
                  flashcardTotal={s.flashcardTotal}
                  flashcardDominados={s.flashcardDominados}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </ShellLayout>
  )
}
