import { NextRequest, NextResponse } from 'next/server'
import { callClaudeStructured, sanitizeUserContent } from '@/lib/anthropic'
import { AVISO_CONTEUDO_NAO_CONFIAVEL } from '@/lib/extracao'
import { validarFlashcardsGerados } from '@/lib/geracao'
import { requireAuth, checkRateLimit, getOwnedDisciplina, readJsonObject } from '@/lib/apiHelpers'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 60

const SCHEMA = {
  type: 'object',
  required: ['flashcards'],
  properties: {
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        required: ['frente', 'verso'],
        properties: { frente: { type: 'string' }, verso: { type: 'string' } },
      },
    },
  },
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = await checkRateLimit(auth.supabase, auth.userId, 'gerar-flashcards', 10)
  if (rl) return rl

  const body = await readJsonObject(req)
  if (body instanceof NextResponse) return body
  const disciplinaId = typeof body.disciplinaId === 'string' ? body.disciplinaId : ''
  if (!disciplinaId) return NextResponse.json({ error: 'disciplinaId é obrigatório' }, { status: 400 })
  const disciplina = await getOwnedDisciplina(auth.supabase, auth.userId, disciplinaId)
  if (!disciplina) {
    return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })
  }

  const { data: topicos, error: erroTopicos } = await auth.supabase
    .from('topicos').select('texto').eq('disciplina_id', disciplinaId).order('ordem')
  if (erroTopicos) {
    logger.error('gerar-flashcards', 'select-topicos', { err: erroTopicos.message })
    return NextResponse.json({ error: 'Erro ao carregar tópicos' }, { status: 500 })
  }
  const topicosStr = (topicos ?? []).map(t => t.texto).join(', ')

  let parsed: unknown
  try {
    parsed = await callClaudeStructured({
      schema: SCHEMA,
      toolName: 'gerar_flashcards',
      toolDescription: 'Gera flashcards para concursos brasileiros.',
      maxTokens: 2048,
      system: `Você gera flashcards para concursos públicos brasileiros. ${AVISO_CONTEUDO_NAO_CONFIAVEL}`,
      user: `Gere 6 flashcards usando apenas estes dados:\n<disciplina>${sanitizeUserContent(disciplina.nome)}</disciplina>\n<topicos>${sanitizeUserContent(topicosStr)}</topicos>`,
    })
  } catch (err) {
    logger.error('gerar-flashcards', 'claude', { err: String(err) })
    return NextResponse.json({ error: 'Erro ao gerar flashcards' }, { status: 502 })
  }

  const flashcards = validarFlashcardsGerados(parsed)
  if (!flashcards.length) {
    return NextResponse.json({ error: 'A IA não devolveu flashcards válidos' }, { status: 502 })
  }
  const { error } = await auth.supabase.from('flashcards').insert(
    flashcards.map(fc => ({
      disciplina_id: disciplinaId, frente: fc.frente, verso: fc.verso,
      box: 1, prox_revisao: new Date().toISOString(),
    }))
  )

  if (error) {
    logger.error('gerar-flashcards', 'insert', { err: error.message })
    return NextResponse.json({ error: 'Erro ao salvar flashcards' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, count: flashcards.length })
}
