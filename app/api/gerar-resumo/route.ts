import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'
import { callClaudeStructured, sanitizeUserContent } from '@/lib/anthropic'
import { AVISO_CONTEUDO_NAO_CONFIAVEL } from '@/lib/extracao'
import { validarResumoGerado } from '@/lib/geracao'
import { validarUrlPublica } from '@/lib/ssrf'
import { requireAuth, checkRateLimit, getOwnedDisciplina, readJsonObject } from '@/lib/apiHelpers'
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
      url = await validarUrlPublica(new URL(loc, url).href)
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
      const restante = MAX_FETCH_BYTES - total
      chunks.push(value.subarray(0, restante))
      total += Math.min(value.byteLength, restante)
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
    const url = new URL(source.value)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || !(host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com'))) {
      throw new Error('Use um link HTTPS do YouTube.')
    }
    const t = await YoutubeTranscript.fetchTranscript(source.value)
    const text = t.map(x => x.text).join(' ').slice(0, MAX_SOURCE_CHARS)
    if (!text) throw new Error('Sem legendas disponíveis nesse vídeo.')
    return { text, label: 'vídeo do YouTube' }
  }
  // url
  const u = await validarUrlPublica(source.value)
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
  const rl = await checkRateLimit(auth.supabase, auth.userId, 'gerar-resumo', 10)
  if (rl) return rl

  const body = await readJsonObject(req)
  if (body instanceof NextResponse) return body
  const disciplinaId = typeof body.disciplinaId === 'string' ? body.disciplinaId : ''
  if (!disciplinaId) return NextResponse.json({ error: 'disciplinaId é obrigatório' }, { status: 400 })
  const disciplina = await getOwnedDisciplina(auth.supabase, auth.userId, disciplinaId)
  if (!disciplina) {
    return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })
  }
  const sourceRaw = body.source && typeof body.source === 'object' && !Array.isArray(body.source)
    ? body.source as Record<string, unknown>
    : null
  const source = sourceRaw && ['text', 'url', 'youtube'].includes(String(sourceRaw.type)) && typeof sourceRaw.value === 'string'
    ? { type: sourceRaw.type as Source['type'], value: sourceRaw.value.slice(0, 50_000) }
    : undefined
  if (body.source !== undefined && !source) {
    return NextResponse.json({ error: 'Fonte inválida' }, { status: 400 })
  }
  if (source && !source.value.trim()) {
    return NextResponse.json({ error: 'A fonte está vazia' }, { status: 400 })
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
      `dentro do contexto da disciplina delimitada abaixo. Estruture em Markdown com seções (##), ` +
      `listas e **negrito** nos termos-chave. Foque no que é cobrável em prova.\n` +
      `<disciplina>${sanitizeUserContent(disciplina.nome)}</disciplina>\n<conteudo>${sanitizeUserContent(extracted.text)}</conteudo>`
  } else {
    const { data: topicos, error: erroTopicos } = await auth.supabase
      .from('topicos').select('texto').eq('disciplina_id', disciplinaId).order('ordem')
    if (erroTopicos) {
      logger.error('gerar-resumo', 'select-topicos', { err: erroTopicos.message })
      return NextResponse.json({ error: 'Erro ao carregar tópicos' }, { status: 500 })
    }
    const topicosStr = (topicos ?? []).map(t => t.texto).join(', ')
    user =
      'Faça um resumo de estudo usando apenas os dados delimitados abaixo. ' +
      'Estruture em Markdown com seções (##), listas e **negrito** nos termos-chave. Seja direto e completo.\n' +
      `<disciplina>${sanitizeUserContent(disciplina.nome)}</disciplina>\n<topicos>${sanitizeUserContent(topicosStr)}</topicos>`
  }

  let parsed: unknown
  try {
    parsed = await callClaudeStructured({
      schema: SCHEMA,
      toolName: 'gerar_resumo',
      toolDescription: 'Gera um resumo de estudo em Markdown para concursos brasileiros.',
      maxTokens: 3000,
      system:
        'Você é um professor de cursinho para concursos públicos brasileiros. Escreve resumos objetivos, ' +
        `focados no que cai em prova, com definições precisas, macetes e pegadinhas comuns das bancas. ${AVISO_CONTEUDO_NAO_CONFIAVEL}`,
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

  const resumo = validarResumoGerado(parsed)
  if (!resumo) return NextResponse.json({ error: 'A IA não devolveu um resumo válido' }, { status: 502 })
  const { error } = await auth.supabase.from('resumos').insert({
    disciplina_id: disciplinaId,
    titulo: resumo.titulo,
    conteudo: resumo.conteudo,
  })
  if (error) {
    logger.error('gerar-resumo', 'insert', { err: error.message })
    return NextResponse.json({ error: 'Erro ao salvar resumo' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
