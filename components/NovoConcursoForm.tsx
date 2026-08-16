'use client'

// Formulário único de criação de concurso.
//
// Antes existiam duas cópias quase idênticas deste form, em HomeClient e em
// ConcursosClient, e a divergência entre elas já tinha custado bug. Agora as
// duas telas montam este componente.
//
// O fluxo tem duas fases porque uma prova inteira não cabe numa resposta só do
// modelo (60 questões transcritas passam do teto de tokens de saída):
//   fase 1  POST /api/criar-com-edital   → concurso + disciplinas + tópicos
//   fase 2  POST /api/importar-questoes  → questões reais, em lotes de ~10
// A fase 1 já grava tudo o que importa, então a fase 2 pode ser pulada ou
// falhar sem levar o plano junto.

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, FileText, Image as ImageIcon, Check, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input, FieldError } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

/**
 * O lote é medido em QUESTÕES, não em disciplinas: o que estoura o limite de
 * saída do modelo é o volume transcrito, e uma disciplina pode ter 6 ou 20
 * questões. A fase 1 devolve o peso (nº de questões) de cada disciplina, então
 * dá para montar lotes de tamanho parecido.
 */
const QUESTOES_POR_LOTE = 10
/** Precisa respeitar MAX_DISCIPLINAS_POR_LOTE da rota. */
const MAX_DISCIPLINAS_POR_LOTE = 4
/** Peso presumido quando o documento não deixou contar as questões. */
const PESO_PADRAO = 8
/** Dois lotes ao mesmo tempo: corta a espera pela metade sem estourar a cota. */
const LOTES_SIMULTANEOS = 2
const MAX_MB = 4

const ACEITOS = '.pdf,.txt,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/png,image/jpeg,image/webp'

type Fonte = 'auto' | 'edital' | 'prova'
type EtapaId = 'lendo' | 'plano' | 'questoes'

interface DisciplinaSalva { id: string; nome: string; peso: number }

interface Props {
  /** Chamada depois que tudo terminou, com o id do concurso criado. */
  onCreated: (concursoId: string, opts: { navegar: boolean }) => void
  onCancel: () => void
}

const FONTES: { key: Fonte; label: string; hint: string }[] = [
  { key: 'auto',   label: 'Detectar',  hint: 'a IA identifica' },
  { key: 'edital', label: 'Edital',    hint: 'conteúdo programático' },
  { key: 'prova',  label: 'Prova',     hint: 'questões anteriores' },
]

/**
 * Agrupa disciplinas em lotes de ~QUESTOES_POR_LOTE questões.
 * Uma disciplina sozinha maior que o alvo vira o seu próprio lote.
 */
export function montarLotes(disciplinas: DisciplinaSalva[]): DisciplinaSalva[][] {
  const lotes: DisciplinaSalva[][] = []
  let atual: DisciplinaSalva[] = []
  let acumulado = 0

  for (const d of disciplinas) {
    // Fecha o lote quando ele JÁ alcançou o alvo, em vez de fechar quando a
    // próxima disciplina passaria dele. Com disciplinas de 6 questões e alvo 10,
    // a segunda regra nunca deixaria duas juntas (6+6 > 10) e produziria um
    // lote por disciplina — o dobro de requisições, sem ganho.
    const cheio = acumulado >= QUESTOES_POR_LOTE || atual.length >= MAX_DISCIPLINAS_POR_LOTE
    if (atual.length && cheio) {
      lotes.push(atual)
      atual = []
      acumulado = 0
    }
    atual.push(d)
    acumulado += d.peso > 0 ? d.peso : PESO_PADRAO
  }
  if (atual.length) lotes.push(atual)
  return lotes
}

async function lerErro(res: Response): Promise<Error & { hint?: string; detail?: string }> {
  let corpo: { error?: string; hint?: string; detail?: string } = {}
  try { corpo = await res.json() } catch { /* resposta sem corpo */ }
  if (res.status === 429) {
    return Object.assign(new Error('Muitas requisições'), { hint: 'Aguarde alguns segundos e tente de novo.' })
  }
  return Object.assign(new Error(corpo.error ?? 'Erro inesperado'), { hint: corpo.hint, detail: corpo.detail })
}

/** 502/504 costumam ser saturação momentânea do modelo; 4xx é problema nosso. */
const valeRepetir = (status: number) => status === 429 || status >= 500

/**
 * POST com uma segunda tentativa. A latência do Gemini para o mesmo documento
 * já foi medida entre 22 s e 82 s, então falha esporádica é esperada e repetir
 * uma vez resolve a maioria dos casos.
 */
async function postarComRetentativa(url: string, montarBody: () => FormData): Promise<Response> {
  for (let tentativa = 0; ; tentativa++) {
    const res = await fetch(url, { method: 'POST', body: montarBody() })
    if (res.ok || tentativa >= 1 || !valeRepetir(res.status)) return res
    await new Promise(r => setTimeout(r, 2000))
  }
}

export default function NovoConcursoForm({ onCreated, onCancel }: Props) {
  const toast = useToast()
  const [nome, setNome]   = useState('')
  const [cargo, setCargo] = useState('')
  const [banca, setBanca] = useState('')
  const [ano, setAno]     = useState('')
  const [file, setFile]   = useState<File | null>(null)
  const [tipo, setTipo]   = useState<Fonte>('auto')
  const [arrastando, setArrastando] = useState(false)
  const [nomeError, setNomeError]   = useState('')
  const [fileError, setFileError]   = useState('')

  const [etapa, setEtapa] = useState<EtapaId | null>(null)
  const [progresso, setProgresso] = useState({ feitos: 0, total: 0, questoes: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  const ocupado = etapa !== null

  function escolherArquivo(f: File | null) {
    setFileError('')
    if (!f) { setFile(null); return }
    if (f.size > MAX_MB * 1024 * 1024) {
      setFileError(`O arquivo tem ${(f.size / 1024 / 1024).toFixed(1)} MB. O limite é ${MAX_MB} MB — comprima o PDF ou envie só as páginas do conteúdo programático.`)
      setFile(null)
      return
    }
    setFile(f)
  }

  /** Fase 2: transcreve as questões da prova, em lotes. */
  async function importarQuestoes(concursoId: string, disciplinas: DisciplinaSalva[], arquivo: File) {
    const lotes = montarLotes(disciplinas)
    setEtapa('questoes')
    setProgresso({ feitos: 0, total: lotes.length, questoes: 0 })

    let importadas = 0
    let falhas = 0
    let feitos = 0

    async function rodarLote(lote: DisciplinaSalva[]) {
      try {
        const res = await postarComRetentativa('/api/importar-questoes', () => {
          const fd = new FormData()
          fd.append('concursoId', concursoId)
          fd.append('arquivo', arquivo)
          fd.append('disciplinas', JSON.stringify(lote.map(d => ({ id: d.id, nome: d.nome }))))
          return fd
        })
        if (!res.ok) throw await lerErro(res)
        const data = await res.json()
        importadas += data.importadas ?? 0
      } catch {
        // Um lote que falha não invalida os outros — o plano já está salvo.
        falhas++
      }
      feitos++
      setProgresso({ feitos, total: lotes.length, questoes: importadas })
    }

    // Concorrência limitada: dois de cada vez corta a espera pela metade e ainda
    // fica longe do limite de requisições por minuto do tier gratuito.
    for (let i = 0; i < lotes.length; i += LOTES_SIMULTANEOS) {
      await Promise.all(lotes.slice(i, i + LOTES_SIMULTANEOS).map(rodarLote))
    }

    return { importadas, falhas }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      setNomeError('Informe o nome do concurso.')
      return
    }
    setNomeError('')

    // Sem arquivo: só cria o registro, direto pelo cliente.
    if (!file) {
      setEtapa('plano')
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Sessão expirada')
        const { data, error } = await supabase.from('concursos').insert({
          nome: nome.trim(),
          cargo: cargo.trim() || null,
          banca: banca.trim() || null,
          ano: ano.trim() || null,
          user_id: user.id,
          fonte: 'manual',
        }).select('id').single()
        if (error) throw new Error(error.message)
        toast.success('Concurso criado!')
        onCreated(data.id, { navegar: false })
      } catch (err) {
        toast.error('Erro ao criar concurso', err instanceof Error ? err.message : undefined)
      }
      setEtapa(null)
      return
    }

    // ─── Fase 1 ───────────────────────────────────────────────────────────────
    setEtapa('lendo')
    let plano: {
      id: string; fonte: string; disciplinas: DisciplinaSalva[]
      topicos: number; podeImportarQuestoes: boolean
    }
    try {
      setEtapa('plano')
      const res = await postarComRetentativa('/api/criar-com-edital', () => {
        const fd = new FormData()
        fd.append('nome', nome.trim())
        if (cargo.trim()) fd.append('cargo', cargo.trim())
        if (banca.trim()) fd.append('banca', banca.trim())
        if (ano.trim())   fd.append('ano', ano.trim())
        fd.append('tipo', tipo)
        fd.append('arquivo', file)
        return fd
      })
      if (!res.ok) throw await lerErro(res)
      plano = await res.json()
    } catch (err) {
      const e = err as Error & { hint?: string; detail?: string }
      toast.error(e.message, e.hint ?? e.detail ?? 'Tente novamente.')
      setEtapa(null)
      return
    }

    const qtdDisciplinas = plano.disciplinas?.length ?? 0
    toast.success(
      `Plano criado — ${qtdDisciplinas} disciplinas, ${plano.topicos} tópicos`,
      plano.fonte === 'prova' ? 'Extraído da prova enviada.' : 'Extraído do edital enviado.',
    )

    // ─── Fase 2 ───────────────────────────────────────────────────────────────
    if (plano.podeImportarQuestoes && qtdDisciplinas > 0) {
      const { importadas, falhas } = await importarQuestoes(plano.id, plano.disciplinas, file)
      if (importadas > 0) {
        toast.success(`${importadas} questões da prova importadas`,
          falhas > 0 ? `${falhas} lote(s) falharam — dá para tentar de novo depois.` : 'Já estão prontas para responder.')
      } else if (falhas > 0) {
        toast.warning('Não consegui importar as questões', 'O plano de estudos foi salvo mesmo assim.')
      }
    }

    setEtapa(null)
    onCreated(plano.id, { navegar: true })
  }

  const Icone = file?.type.startsWith('image/') ? ImageIcon : FileText

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Novo concurso</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={ocupado}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-muted cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <div>
            <label htmlFor="nc-nome" className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Nome *</label>
            <Input
              id="nc-nome"
              value={nome}
              onChange={e => { setNome(e.target.value); if (nomeError) setNomeError('') }}
              aria-invalid={!!nomeError}
              disabled={ocupado}
              placeholder="ex.: Banco do Brasil 2025"
            />
            <FieldError>{nomeError}</FieldError>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="nc-cargo" className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Cargo</label>
              <Input id="nc-cargo" value={cargo} onChange={e => setCargo(e.target.value)} disabled={ocupado} placeholder="ex.: Agente de TI" />
            </div>
            <div>
              <label htmlFor="nc-banca" className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Banca</label>
              <Input id="nc-banca" value={banca} onChange={e => setBanca(e.target.value)} disabled={ocupado} placeholder="ex.: Cesgranrio" />
            </div>
            <div>
              <label htmlFor="nc-ano" className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Ano</label>
              <Input id="nc-ano" value={ano} onChange={e => setAno(e.target.value)} disabled={ocupado} inputMode="numeric" placeholder="ex.: 2025" />
            </div>
          </div>
          <p className="text-[11px] text-dimmed -mt-1">Deixe em branco o que a IA puder achar sozinha no documento.</p>

          {/* ─── Documento ─── */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
              Documento — opcional
            </label>

            <div role="radiogroup" aria-label="Tipo de documento" className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-elevated border border-border mb-2">
              {FONTES.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={tipo === opt.key}
                  onClick={() => setTipo(opt.key)}
                  disabled={ocupado}
                  className={`rounded-md px-2 py-2 text-sm font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed ${
                    tipo === opt.key
                      ? 'bg-[#4A72E8] text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                  <span className={`block font-mono text-[9px] uppercase tracking-wider mt-0.5 ${tipo === opt.key ? 'text-white/70' : 'text-dimmed'}`}>
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>

            <div
              onClick={() => !ocupado && inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); if (!ocupado) setArrastando(true) }}
              onDragLeave={() => setArrastando(false)}
              onDrop={e => {
                e.preventDefault(); setArrastando(false)
                if (!ocupado) escolherArquivo(e.dataTransfer.files[0] ?? null)
              }}
              className={`w-full rounded-lg border-2 border-dashed px-4 py-5 text-center transition-all duration-150 ${
                ocupado ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              } ${
                arrastando ? 'border-[#4A72E8] bg-[#4A72E8]/10'
                  : file ? 'border-[#4A72E8]/50 bg-[#4A72E8]/5'
                  : 'border-border hover:border-[#4A72E8]/30 hover:bg-elevated'
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <Icone size={14} className="text-[#4A72E8] flex-shrink-0" />
                  <span className="text-sm text-[#4A72E8] font-medium truncate max-w-xs">{file.name}</span>
                  <span className="font-mono text-[10px] text-dimmed">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  {!ocupado && (
                    <button
                      type="button"
                      aria-label="Remover arquivo"
                      onClick={ev => { ev.stopPropagation(); escolherArquivo(null) }}
                      className="text-muted-foreground hover:text-red-500 ml-1 cursor-pointer transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <Upload size={20} className="text-border mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">Arraste o arquivo ou clique para selecionar</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                    PDF · JPG · PNG · TXT · até {MAX_MB} MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACEITOS}
              className="hidden"
              onChange={e => escolherArquivo(e.target.files?.[0] ?? null)}
            />
            <FieldError>{fileError}</FieldError>

            {file && !fileError && (
              <p className="text-[11px] text-[#4A72E8] mt-1.5 flex items-start gap-1.5">
                <Sparkles size={12} className="mt-0.5 flex-shrink-0" />
                <span>
                  {tipo === 'prova'
                    ? 'A IA vai mapear as disciplinas e importar as questões da prova.'
                    : tipo === 'edital'
                      ? 'A IA vai extrair o conteúdo programático em disciplinas e tópicos.'
                      : 'A IA identifica se é edital ou prova e monta o plano — provas viram questões para responder.'}
                  {' '}Funciona com PDF escaneado e foto.
                </span>
              </p>
            )}
          </div>

          {ocupado && <Progresso etapa={etapa!} progresso={progresso} temArquivo={!!file} />}

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={ocupado} className="flex-1">
              {ocupado ? 'Processando…' : file ? 'Criar e gerar plano com IA' : 'Criar concurso'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={ocupado}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Progresso multi-etapa ────────────────────────────────────────────────────
// Ler um PDF escaneado e transcrever 60 questões leva mais de um minuto. Sem
// mostrar em que pé está, a espera parece travamento.

function Progresso({ etapa, progresso, temArquivo }: {
  etapa: EtapaId
  progresso: { feitos: number; total: number; questoes: number }
  temArquivo: boolean
}) {
  const etapas: { id: EtapaId; label: string }[] = [
    { id: 'lendo', label: temArquivo ? 'Lendo o documento' : 'Preparando' },
    { id: 'plano', label: 'Montando o plano de estudos' },
    { id: 'questoes', label: 'Importando as questões da prova' },
  ]
  const atual = etapas.findIndex(e => e.id === etapa)
  const pct = progresso.total ? Math.round((progresso.feitos / progresso.total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      aria-live="polite"
      className="rounded-lg border border-[#4A72E8]/25 bg-[#4A72E8]/5 p-3 space-y-2"
    >
      {etapas.map((e, i) => {
        const feita = i < atual
        const ativa = i === atual
        // A terceira etapa só existe quando é prova; antes disso fica escondida.
        if (e.id === 'questoes' && atual < 2) return null
        return (
          <div key={e.id} className={`flex items-center gap-2 text-sm ${ativa ? 'text-[#4A72E8] font-medium' : feita ? 'text-muted' : 'text-dimmed'}`}>
            {feita ? <Check size={14} className="flex-shrink-0" />
              : ativa ? <Loader2 size={14} className="animate-spin flex-shrink-0" />
              : <span className="w-3.5" />}
            <span>{e.label}</span>
            {ativa && e.id === 'questoes' && progresso.total > 0 && (
              <span className="font-mono text-[11px] text-muted ml-auto">
                lote {progresso.feitos}/{progresso.total}
                {progresso.questoes > 0 && ` · ${progresso.questoes} questões`}
              </span>
            )}
          </div>
        )
      })}

      {etapa === 'questoes' && progresso.total > 0 && (
        <div className="h-1 rounded-full bg-[#4A72E8]/15 overflow-hidden">
          <motion.div
            className="h-full bg-[#4A72E8]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
    </motion.div>
  )
}
