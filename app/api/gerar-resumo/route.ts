import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import { callClaudeStructured } from '@/lib/anthropic'
import { requireAuth, checkRateLimit, assertDisciplinaOwnership } from '@/lib/apiHelpers'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_SOURCE_CHARS = 12000

const SCHEMA = {
  type: 'object',
  required: ['titulo', 'conteudo'],
  properties: {
    titulo: { type: 'string', description: 'Título curto do resumo' },
    conteudo: {
      type: 'string',
      description:
        'Resumo em Markdown. Use ## para seções, listas com - e **negrito** para termos-chave. Objetivo, direto ao ponto de prova.',
    },
  },
}

// ── Source extraction ─────────────────────────────────────────────────────────
type Source = { type: 'text' | 'url' | 'youtube'; value: string }

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|h[1-6]|li|br|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

// Basic SSRF guard: only http(s), and refuse obvious internal hosts.
function assertPublicUrl(raw: string): URL {
  const u = new URL(raw)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Só http(s).')
  const host = u.hostname.toLowerCase()
  const blocked =
    host === 'localhost' || host.endsWith('.local') || host === '0.0.0.0' ||
    host === '::1' || host.startsWith('127.') || host.startsWith('10.') ||
    host.startsWith('192.168.') || host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  if (blocked) throw new Error('Endereço interno não permitido.')
  return u
}

async function extractSource(source: Source): Promise<{ text: string; label: string }> {
  if (source.type === 'text') {
    return { text: source.value.slice(0, MAX_SOURCE_CHARS), label: 'texto colado' }
  }
  if (source.type === 'youtube') {
    const t = await YoutubeTranscript.fetchTranscript(source.value)
    const text = t.map(x => x.text).join(' ').slice(0, MAX_SOURCE_CHARS)
    if (!text) throw new Error('Sem legendas disponíveis nesse vídeo.')
    return { text, label: 'vídeo do YouTube' }
  }
  // url
  const u = assertPublicUrl(source.value)
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(u, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; gabaritoAI/1.0)' },
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`Página respondeu ${res.status}.`)
    const html = await res.text()
    const text = stripHtml(html).slice(0, MAX_SOURCE_CHARS)
    if (text.length < 40) throw new Error('Não consegui extrair texto dessa página.')
    return { text, label: 'página web' }
  } finally {
    clearTimeout(to)
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = checkRateLimit(auth.userId, 'gerar-resumo', 10)
  if (rl) return rl

  const { disciplinaId, disciplinaNome, source } = await req.json() as {
    disciplinaId?: string; disciplinaNome?: string; source?: Source
  }
  if (!disciplinaId || !disciplinaNome) {
    return NextResponse.json({ error: 'disciplinaId e disciplinaNome são obrigatórios' }, { status: 400 })
  }
  if (!(await assertDisciplinaOwnership(auth.supabase, auth.userId, disciplinaId))) {
    return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })
  }

  // Build the prompt from either a provided source or the disciplina's topics.
  let user: string
  if (source && source.value?.trim()) {
    let extracted: { text: string; label: string }
    try {
      extracted = await extractSource(source)
    } catch (err) {
      return NextResponse.json({ error: `Fonte inválida: ${err instanceof Error ? err.message : 'erro'}` }, { status: 400 })
    }
    user =
      `Resuma o conteúdo abaixo (${extracted.label}) para estudo de concurso, ` +
      `dentro do contexto da disciplina "${disciplinaNome}". Estruture em Markdown com seções (##), ` +
      `listas e **negrito** nos termos-chave. Foque no que é cobrável em prova.\n\n<conteudo>\n${extracted.text}\n</conteudo>`
  } else {
    const { data: topicos } = await auth.supabase
      .from('topicos').select('texto').eq('disciplina_id', disciplinaId).order('ordem')
    const topicosStr = (topicos ?? []).map(t => t.texto).join(', ')
    user =
      `Faça um resumo de estudo da disciplina "${disciplinaNome}"` +
      (topicosStr ? ` cobrindo estes tópicos: ${topicosStr}.` : '.') +
      ' Estruture em Markdown com seções (##), listas e **negrito** nos termos-chave. Seja direto e completo.'
  }

  let parsed: { titulo: string; conteudo: string }
  try {
    parsed = await callClaudeStructured({
      schema: SCHEMA,
      toolName: 'gerar_resumo',
      toolDescription: 'Gera um resumo de estudo em Markdown para concursos brasileiros.',
      maxTokens: 3000,
      system:
        'Você é um professor de cursinho para concursos públicos brasileiros. Escreve resumos objetivos, ' +
        'focados no que cai em prova, com definições precisas, macetes e pegadinhas comuns das bancas.',
      user,
    })
  } catch (err) {
    logger.error('gerar-resumo', 'claude', { err: String(err) })
    const raw = String(err)
    const friendly =
      /credit balance|billing|insufficient|quota/i.test(raw)
        ? 'Sem créditos na Anthropic. Adicione créditos em console.anthropic.com → Billing e tente de novo.'
      : /rate.?limit|overloaded|429|529/i.test(raw)
        ? 'A IA está sobrecarregada no momento. Tente novamente em instantes.'
      : /api.?key|authentication|401/i.test(raw)
        ? 'Chave da Anthropic inválida. Verifique a variável ANTHROPIC_API_KEY.'
        : 'Erro ao gerar resumo. Tente novamente.'
    return NextResponse.json({ error: friendly }, { status: 502 })
  }

  const { error } = await auth.supabase.from('resumos').insert({
    disciplina_id: disciplinaId,
    titulo: parsed.titulo,
    conteudo: parsed.conteudo,
  })
  if (error) {
    logger.error('gerar-resumo', 'insert', { err: error.message })
    return NextResponse.json({ error: 'Erro ao salvar resumo' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
