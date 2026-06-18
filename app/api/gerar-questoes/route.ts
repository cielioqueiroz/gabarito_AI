import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

function parseJSON(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

export async function POST(req: NextRequest) {
  try {
    const { disciplinaId, disciplinaNome } = await req.json()
    if (!disciplinaId || !disciplinaNome) {
      return NextResponse.json({ error: 'disciplinaId e disciplinaNome são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: topicos } = await supabase
      .from('topicos')
      .select('texto')
      .eq('disciplina_id', disciplinaId)
      .order('ordem')

    const topicosStr = (topicos ?? []).map(t => t.texto).join(', ')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Você cria questões de múltipla escolha estilo banca de concurso (5 alternativas, uma correta). Responda APENAS com JSON válido, sem markdown.',
      messages: [
        {
          role: 'user',
          content: `Crie 4 questões sobre "${disciplinaNome}" cobrindo: ${topicosStr}. Formato: [{"enunciado":"...","alternativas":[{"letra":"A","texto":"..."}, ...],"correta":"A","explicacao":"..."}]`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed: {
      enunciado: string
      alternativas: { letra: string; texto: string }[]
      correta: string
      explicacao: string
    }[] = parseJSON(raw)

    await supabase.from('questoes').insert(
      parsed.map(q => ({
        disciplina_id: disciplinaId,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        correta: q.correta,
        explicacao: q.explicacao ?? null,
      }))
    )

    return NextResponse.json({ ok: true, count: parsed.length })
  } catch (err: unknown) {
    console.error('gerar-questoes error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
