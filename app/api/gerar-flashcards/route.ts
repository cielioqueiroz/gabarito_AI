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
      max_tokens: 2048,
      system: 'Você gera flashcards para concursos públicos brasileiros. Responda APENAS com JSON válido, sem markdown.',
      messages: [
        {
          role: 'user',
          content: `Gere 6 flashcards para a disciplina "${disciplinaNome}" cobrindo: ${topicosStr}. Formato: [{"frente":"pergunta curta","verso":"resposta objetiva"}]`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed: { frente: string; verso: string }[] = parseJSON(raw)

    await supabase.from('flashcards').insert(
      parsed.map(fc => ({
        disciplina_id: disciplinaId,
        frente: fc.frente,
        verso: fc.verso,
        box: 1,
        prox_revisao: new Date().toISOString(),
      }))
    )

    return NextResponse.json({ ok: true, count: parsed.length })
  } catch (err: unknown) {
    console.error('gerar-flashcards error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
