import { NextRequest, NextResponse } from 'next/server'
import { callClaudeStructured } from '@/lib/anthropic'
import { requireAuth, checkRateLimit, assertDisciplinaOwnership } from '@/lib/apiHelpers'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 60

const SCHEMA = {
  type: 'object',
  required: ['titulo', 'conteudo'],
  properties: {
    titulo: { type: 'string', description: 'Título curto do resumo (ex.: "Segurança da Informação — Essencial")' },
    conteudo: {
      type: 'string',
      description:
        'Resumo em Markdown. Use ## para seções, listas com - e **negrito** para termos-chave. Objetivo, direto ao ponto de prova, com definições, macetes e pegadinhas comuns de banca.',
    },
  },
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = checkRateLimit(auth.userId, 'gerar-resumo', 10)
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

  let parsed: { titulo: string; conteudo: string }
  try {
    parsed = await callClaudeStructured({
      schema: SCHEMA,
      toolName: 'gerar_resumo',
      toolDescription: 'Gera um resumo de estudo em Markdown para concursos brasileiros.',
      maxTokens: 3000,
      system:
        'Você é um professor de cursinho para concursos públicos brasileiros. Escreve resumos objetivos, ' +
        'focados no que cai em prova, com definições precisas, macetes e as pegadinhas mais comuns das bancas.',
      user:
        `Faça um resumo de estudo da disciplina "${disciplinaNome}"` +
        (topicosStr ? ` cobrindo estes tópicos: ${topicosStr}.` : '.') +
        ' Estruture em Markdown com seções (##), listas e **negrito** nos termos-chave. Seja direto e completo, mas sem enrolação.',
    })
  } catch (err) {
    logger.error('gerar-resumo', 'claude', { err: String(err) })
    return NextResponse.json({ error: 'Erro ao gerar resumo' }, { status: 502 })
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
