'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronDown, Sparkles, Volume2, Square } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AiGenerateDialog } from './AiGenerateDialog'
import type { Disciplina, Resumo, Topico } from '@/types'

interface Props {
  disciplinas: Disciplina[]
  resumos: Resumo[]
  topicos?: Topico[]
}

// ── Minimal, safe Markdown → React (headings, bullets, **bold**, paragraphs) ──
function renderInline(text: string, k: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={`${k}-${i}`} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
      : <span key={`${k}-${i}`}>{p}</span>
  )
}

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s*/gm, '')     // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/^[-*]\s*/gm, '')        // bullets
    .replace(/\s+/g, ' ')
    .trim()
}

// "Ouvir" — narração via Web Speech API do navegador (grátis, sem chave, sem
// backend). Uma prévia do futuro "podcast" com TTS de estúdio.
function ListenButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [])

  function toggle() {
    const synth = window.speechSynthesis
    if (speaking) { synth.cancel(); setSpeaking(false); return }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'pt-BR'
    u.rate = 1
    const ptVoice = synth.getVoices().find(v => v.lang?.toLowerCase().startsWith('pt'))
    if (ptVoice) u.voice = ptVoice
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(u)
  }

  if (!supported) return null
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors cursor-pointer ${
        speaking
          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
          : 'border-border text-muted-foreground hover:border-blue-500/30 hover:text-blue-400'
      }`}
      title={speaking ? 'Parar narração' : 'Ouvir resumo'}
    >
      {speaking ? <><Square size={11} /> Parar</> : <><Volume2 size={12} /> Ouvir</>}
    </button>
  )
}

function Markdown({ content }: { content: string }) {
  const blocks: React.ReactNode[] = []
  let list: string[] = []
  let k = 0
  const flush = () => {
    if (list.length) {
      const items = list
      blocks.push(
        <ul key={`ul-${k++}`} className="my-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {items.map((li, i) => <li key={i}>{renderInline(li, `li-${k}-${i}`)}</li>)}
        </ul>
      )
      list = []
    }
  }
  for (const raw of content.split('\n')) {
    const line = raw.trimEnd()
    if (/^#{1,6}\s/.test(line)) {
      flush()
      const level = (line.match(/^#+/)?.[0].length) ?? 2
      const text = line.replace(/^#+\s*/, '')
      const cls = level <= 2 ? 'mt-4 mb-1.5 text-base font-bold text-foreground' : 'mt-3 mb-1 text-sm font-semibold text-foreground'
      blocks.push(<p key={`h-${k++}`} className={cls}>{renderInline(text, `h-${k}`)}</p>)
    } else if (/^[-*]\s/.test(line)) {
      list.push(line.replace(/^[-*]\s*/, ''))
    } else if (line.trim() === '') {
      flush()
    } else {
      flush()
      blocks.push(<p key={`p-${k++}`} className="my-1.5 text-sm leading-relaxed text-muted">{renderInline(line, `p-${k}`)}</p>)
    }
  }
  flush()
  return <div>{blocks}</div>
}

export default function ResumoTab({ disciplinas, resumos, topicos = [] }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [previewDisc, setPreviewDisc] = useState<Disciplina | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  async function handleGerar(discId: string, discNome: string) {
    setGenerating(discId)
    try {
      const res = await fetch('/api/gerar-resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disciplinaId: discId, disciplinaNome: discNome }),
      })
      if (res.status === 429) throw new Error('Muitas requisições. Aguarde alguns segundos.')
      if (!res.ok) throw new Error(await res.text())
      toast.success('Resumo gerado!', `${discNome} tem um novo resumo.`)
      router.refresh()
    } catch (err: unknown) {
      toast.error('Erro ao gerar resumo', err instanceof Error ? err.message : 'Tente novamente.')
    }
    setGenerating(null)
  }

  if (disciplinas.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Crie um plano de estudos primeiro.</p>
  }

  return (
    <div className="space-y-4">
      {disciplinas.map(disc => {
        const discResumos = resumos.filter(r => r.disciplina_id === disc.id)
        return (
          <Card key={disc.id}>
            <CardContent className="pt-4">
              <div className="mb-1 flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{disc.nome}</h3>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {discResumos.length} {discResumos.length === 1 ? 'resumo' : 'resumos'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-3 flex-shrink-0"
                  onClick={() => setPreviewDisc(disc)}
                  disabled={generating === disc.id}
                >
                  {generating === disc.id ? '…' : <><Sparkles size={13} /> IA</>}
                </Button>
              </div>

              {discResumos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {discResumos.map(r => {
                    const open = openId === r.id
                    return (
                      <div key={r.id} className="overflow-hidden rounded-lg border border-border bg-elevated/40">
                        <button
                          onClick={() => setOpenId(open ? null : r.id)}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-elevated/70 cursor-pointer"
                        >
                          <FileText size={15} className="flex-shrink-0 text-blue-400" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{r.titulo}</span>
                          <ChevronDown size={15} className={`flex-shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border px-4 py-3">
                                <div className="mb-3 flex justify-end">
                                  <ListenButton text={stripMarkdown(r.conteudo)} />
                                </div>
                                <Markdown content={r.conteudo} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <AiGenerateDialog
        open={!!previewDisc}
        onClose={() => setPreviewDisc(null)}
        onConfirm={async () => { if (previewDisc) await handleGerar(previewDisc.id, previewDisc.nome) }}
        disciplinaNome={previewDisc?.nome ?? ''}
        topicos={previewDisc ? topicos.filter(t => t.disciplina_id === previewDisc.id).map(t => t.texto) : []}
        what="resumo"
      />
    </div>
  )
}
