'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConcursoCard from './ConcursoCard'
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

export default function HomeClient({ stats, userEmail }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [banca, setBanca] = useState('')
  const [ano, setAno] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetForm() {
    setNome('')
    setCargo('')
    setBanca('')
    setAno('')
    setFile(null)
    setShowForm(false)
    setError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)
    setError('')

    try {
      if (file) {
        // Fluxo com edital: cria concurso + gera plano em um passo
        setLoadingMsg('Criando concurso…')
        const fd = new FormData()
        fd.append('nome', nome.trim())
        if (cargo.trim()) fd.append('cargo', cargo.trim())
        if (banca.trim()) fd.append('banca', banca.trim())
        if (ano.trim()) fd.append('ano', ano.trim())
        fd.append('edital', file)

        setLoadingMsg('Extraindo texto do edital…')
        const res = await fetch('/api/criar-com-edital', { method: 'POST', body: fd })
        const data = await res.json()

        if (!res.ok) throw new Error(data.error ?? 'Erro ao criar concurso')

        setLoadingMsg('')
        resetForm()
        router.push(`/concurso/${data.id}`)
      } else {
        // Fluxo sem edital: cria concurso simples
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('concursos').insert({
          nome: nome.trim(),
          cargo: cargo.trim() || null,
          banca: banca.trim() || null,
          ano: ano.trim() || null,
          user_id: user!.id,
        })
        if (error) throw new Error(error.message)
        resetForm()
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }

    setLoading(false)
    setLoadingMsg('')
  }

  async function handleDelete(id: string) {
    await createClient().from('concursos').delete().eq('id', id)
    router.refresh()
  }

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-mono text-lg font-bold text-slate-900 tracking-tight">
            gabarito<span className="text-blue-600">_AI</span><span className="inline-block w-1.5 h-4 bg-blue-600 ml-0.5 align-middle animate-blink" />
          </span>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hidden sm:block">
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-slate-900 text-xl tracking-tight">Meus concursos</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {stats.length === 0 ? 'Nenhum concurso ainda' : `${stats.length} concurso${stats.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2" />
            </svg>
            Novo
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-4">Novo concurso</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                  Nome *
                </label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                  placeholder="ex.: Banco do Brasil 2025"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Cargo
                  </label>
                  <input
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    placeholder="ex.: Agente de TI"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                    Banca
                  </label>
                  <input
                    value={banca}
                    onChange={e => setBanca(e.target.value)}
                    placeholder="ex.: Cesgranrio"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                  Ano
                </label>
                <input
                  value={ano}
                  onChange={e => setAno(e.target.value)}
                  placeholder="ex.: 2025"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Upload de edital */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
                  Edital (PDF ou TXT) — opcional
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const dropped = e.dataTransfer.files[0]
                    if (dropped) setFile(dropped)
                  }}
                  className={`w-full rounded-lg border-2 border-dashed px-4 py-5 text-center cursor-pointer transition ${
                    file
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1L14 4.5z"/>
                      </svg>
                      <span className="text-sm text-blue-700 font-medium truncate max-w-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={ev => { ev.stopPropagation(); setFile(null) }}
                        className="text-slate-400 hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-6 h-6 text-slate-300 mx-auto mb-1" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
                        <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z"/>
                      </svg>
                      <p className="text-xs text-slate-400">Arraste o edital aqui ou clique para selecionar</p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-300 mt-0.5">PDF ou TXT</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                {file && (
                  <p className="text-[11px] text-blue-600 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
                    </svg>
                    A IA vai organizar o edital em disciplinas e tópicos ao criar
                  </p>
                )}
              </div>

              {error && <p className="text-red-500 text-sm rounded-lg bg-red-50 px-3 py-2">{error}</p>}

              {loading && loadingMsg && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {loadingMsg}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                >
                  {loading
                    ? (file ? 'Processando edital…' : 'Salvando…')
                    : (file ? 'Criar e gerar plano com IA' : 'Criar concurso')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 rounded-lg border border-slate-200 text-slate-600 py-2 text-sm font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {stats.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 mb-4">
              <svg className="w-6 h-6 text-slate-400" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z" />
                <path d="M7 5.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1H8v.5l3 3 1.354-1.353a.5.5 0 0 1 .707.707l-1.5 1.5a.5.5 0 0 1-.707 0L8.5 8.207V9.5a.5.5 0 0 1-1 0v-4z" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">Nenhum concurso cadastrado.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
            >
              Criar o primeiro concurso →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
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
          </div>
        )}
      </main>
    </div>
  )
}
