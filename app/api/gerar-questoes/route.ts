import { NextRequest, NextResponse } from 'next/server'
import { callClaudeStructured, sanitizeUserContent } from '@/lib/anthropic'
import { AVISO_CONTEUDO_NAO_CONFIAVEL } from '@/lib/extracao'
import { validarQuestoesGeradas } from '@/lib/geracao'
import { requireAuth, checkRateLimit, getOwnedDisciplina, readJsonObject } from '@/lib/apiHelpers'
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
        required: ['enunciado', 'alternativas', 'correta', 'explicacao', 'dificuldade'],
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
          dificuldade: { type: 'string', enum: ['facil', 'medio', 'dificil'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = await checkRateLimit(auth.supabase, auth.userId, 'gerar-questoes', 10)
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
    logger.error('gerar-questoes', 'select-topicos', { err: erroTopicos.message })
    return NextResponse.json({ error: 'Erro ao carregar tópicos' }, { status: 500 })
  }
  const topicosStr = (topicos ?? []).map(t => t.texto).join(', ')

  let parsed: unknown
  try {
    parsed = await callClaudeStructured({
      schema: SCHEMA,
      toolName: 'gerar_questoes',
      toolDescription: 'Gera questões de múltipla escolha estilo banca de concurso.',
      system: `Você cria questões de múltipla escolha estilo banca de concurso, com 5 alternativas e uma correta. ${AVISO_CONTEUDO_NAO_CONFIAVEL}`,
      user: `Crie 4 questões usando apenas estes dados:\n<disciplina>${sanitizeUserContent(disciplina.nome)}</disciplina>\n<topicos>${sanitizeUserContent(topicosStr)}</topicos>`,
    })
  } catch (err) {
    logger.error('gerar-questoes', 'claude', { err: String(err) })
    return NextResponse.json({ error: 'Erro ao gerar questões' }, { status: 502 })
  }

  const questoes = validarQuestoesGeradas(parsed)
  if (!questoes.length) {
    return NextResponse.json({ error: 'A IA não devolveu questões válidas' }, { status: 502 })
  }
  const { error } = await auth.supabase.from('questoes').insert(
    questoes.map(q => ({
      disciplina_id: disciplinaId,
      enunciado: q.enunciado, alternativas: q.alternativas,
      correta: q.correta, explicacao: q.explicacao ?? null,
      dificuldade: q.dificuldade ?? 'medio',
      tags: q.tags ?? [],
    }))
  )

  if (error) {
    logger.error('gerar-questoes', 'insert', { err: error.message })
    return NextResponse.json({ error: 'Erro ao salvar questões' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, count: questoes.length })
}
