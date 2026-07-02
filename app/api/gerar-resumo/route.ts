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

// SSRF guard: only http(s), no IP-literal hosts (evita 0x7f…, 127.1 e afins),
// and refuse obvious internal hosts. Redirects são seguidos manualmente e cada
// salto é re-validado (um 302 para IP interno não passa).
function assertPublicUrl(raw: string): URL {
  const u = new URL(raw)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Só http(s).')
  const host = u.hostname.toLowerCase()
  // IP literal (v4 em qualquer formato, ou v6 entre colchetes): recusa direto —
  // conteúdo de estudo legítimo não mora em IP cru.
  if (host.includes(':') || /^[0-9x.]+$/.test(host)) throw new Error('Use um domínio, não um IP.')
  const blocked =
    host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') ||
    host.startsWith('127.') || host.startsWith('10.') ||
    host.startsWith('192.168.') || host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  if (blocked) throw new Error('Endereço interno não permitido.')
  return u
}

const MAX_FETCH_BYTES = 2 * 1024 * 1024 // 2 MB de HTML é mais que suficiente
const MAX_REDIRECTS = 3

// fetch com redirects manuais (cada destino re-validado) e corpo com teto.
async function fetchPublicPage(start: URL, signal: AbortSignal): Promise<string> {
  let url = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; gabaritoAI/1.0)' },
      signal,
      redirect: 'manual',
    })
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) throw new Error(`Página respondeu ${res.status}.`)
      url = assertPublicUrl(new URL(loc, url).href)
      continue
    }
    if (!res.ok) throw new Error(`Página respondeu ${res.status}.`)
    const ct = res.headers.get('content-type') ?? ''
    if (ct && !/text\/(html|plain)|application\/xhtml/i.test(ct)) {
      throw new Error('O link não aponta para uma página de texto.')
    }
    // Lê em stream com teto — não confia no content-length declarado.
    const reader = res.body?.getReader()
    if (!reader) return ''
    const chunks: Uint8Array[] = []
    let total = 0
    while (total < MAX_FETCH_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      total += value.byteLength
    }
    await reader.cancel().catch(() => {})
    return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(chunks.map(c => Buffer.from(c))))
  }
  throw new Error('Redirecionamentos demais.')
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
    const html = await fetchPublicPage(u, ctrl.signal)
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
      /quota|resource.?exhausted|billing|insufficient/i.test(raw)
        ? 'Limite gratuito da IA atingido por agora. Aguarde um pouco e tente de novo.'
      : /rate.?limit|overloaded|429|529|503/i.test(raw)
        ? 'A IA está sobrecarregada no momento. Tente novamente em instantes.'
      : /api.?key|authentication|401|403/i.test(raw)
        ? 'Chave da IA inválida ou ausente. Verifique a configuração do servidor.'
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
