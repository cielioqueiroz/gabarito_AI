import { NextRequest, NextResponse } from 'next/server'
import { callClaudeStructured } from '@/lib/anthropic'
import { requireAuth, checkRateLimit, assertDisciplinaOwnership } from '@/lib/apiHelpers'
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
  const rl = checkRateLimit(auth.userId, 'gerar-flashcards', 10)
  if (rl) return rl

  const { disciplinaId, disciplinaNome } = await req.json()
  if (!disciplinaId || !disciplinaNome) {
    return NextResponse.json({ error: 'disciplinaId e disciplinaNome são obrigatórios' }, { status: 400 })
  }
  if (!(await assertDisciplinaOwnership(auth.supabase, auth.userId, disciplinaId))) {
    return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })
  }

  const { data: topicos } = await auth.supabase
    .from('topicos').select('texto').eq('disciplina_id', disciplinaId).order('ordem')
  const topicosStr = (topicos ?? []).map(t => t.texto).join(', ')

  let parsed: { flashcards: { frente: string; verso: string }[] }
  try {
    parsed = await callClaudeStructured({
      schema: SCHEMA,
      toolName: 'gerar_flashcards',
      toolDescription: 'Gera flashcards para concursos brasileiros.',
      maxTokens: 2048,
      system: 'Você gera flashcards para concursos públicos brasileiros.',
      user: `Gere 6 flashcards para a disciplina "${disciplinaNome}" cobrindo: ${topicosStr}`,
    })
  } catch (err) {
    logger.error('gerar-flashcards', 'claude', { err: String(err) })
    return NextResponse.json({ error: 'Erro ao gerar flashcards' }, { status: 502 })
  }

  await auth.supabase.from('flashcards').insert(
    parsed.flashcards.map(fc => ({
      disciplina_id: disciplinaId, frente: fc.frente, verso: fc.verso,
      box: 1, prox_revisao: new Date().toISOString(),
    }))
  )

  return NextResponse.json({ ok: true, count: parsed.flashcards.length })
}
