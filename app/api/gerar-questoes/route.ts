import { NextRequest, NextResponse } from 'next/server'
import { callClaudeStructured } from '@/lib/anthropic'
import { requireAuth, checkRateLimit, assertDisciplinaOwnership } from '@/lib/apiHelpers'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 60

const SCHEMA = {
  type: 'object',
  required: ['questoes'],
  properties: {
    questoes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['enunciado', 'alternativas', 'correta', 'explicacao'],
        properties: {
          enunciado: { type: 'string' },
          alternativas: {
            type: 'array',
            items: {
              type: 'object',
              required: ['letra', 'texto'],
              properties: { letra: { type: 'string' }, texto: { type: 'string' } },
            },
          },
          correta: { type: 'string' },
          explicacao: { type: 'string' },
        },
      },
    },
  },
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = checkRateLimit(auth.userId, 'gerar-questoes', 10)
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

  let parsed: {
    questoes: {
      enunciado: string
      alternativas: { letra: string; texto: string }[]
      correta: string
      explicacao: string
    }[]
  }
  try {
    parsed = await callClaudeStructured({
      schema: SCHEMA,
      toolName: 'gerar_questoes',
      toolDescription: 'Gera questões de múltipla escolha estilo banca de concurso.',
      system: 'Você cria questões de múltipla escolha estilo banca de concurso (5 alternativas, uma correta).',
      user: `Crie 4 questões sobre "${disciplinaNome}" cobrindo: ${topicosStr}`,
    })
  } catch (err) {
    logger.error('gerar-questoes', 'claude', { err: String(err) })
    return NextResponse.json({ error: 'Erro ao gerar questões' }, { status: 502 })
  }

  await auth.supabase.from('questoes').insert(
    parsed.questoes.map(q => ({
      disciplina_id: disciplinaId,
      enunciado: q.enunciado, alternativas: q.alternativas,
      correta: q.correta, explicacao: q.explicacao ?? null,
    }))
  )

  return NextResponse.json({ ok: true, count: parsed.questoes.length })
}
