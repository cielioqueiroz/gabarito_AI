import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

function parseJSON(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

export async function POST(req: NextRequest) {
  try {
    const { texto, concursoId } = await req.json()
    if (!texto || !concursoId) {
      return NextResponse.json({ error: 'texto e concursoId são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: concurso } = await supabase
      .from('concursos')
      .select('id')
      .eq('id', concursoId)
      .eq('user_id', user.id)
      .single()
    if (!concurso) return NextResponse.json({ error: 'Concurso não encontrado' }, { status: 404 })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Você organiza editais de concurso em plano de estudos estruturado. Responda APENAS com JSON válido, sem markdown.',
      messages: [
        {
          role: 'user',
          content: `A partir deste conteúdo programático, gere um plano de estudos agrupado em disciplinas e tópicos. Formato: {"disciplinas":[{"nome":"...","topicos":["...","..."]}]}. Conteúdo: ${texto}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed: { disciplinas: { nome: string; topicos: string[] }[] } = parseJSON(raw)

    const { data: existingDiscs } = await supabase
      .from('disciplinas')
      .select('id')
      .eq('concurso_id', concursoId)

    if (existingDiscs && existingDiscs.length > 0) {
      const ids = existingDiscs.map(d => d.id)
      await supabase.from('topicos').delete().in('disciplina_id', ids)
      await supabase.from('disciplinas').delete().eq('concurso_id', concursoId)
    }

    for (let i = 0; i < parsed.disciplinas.length; i++) {
      const disc = parsed.disciplinas[i]
      const { data: newDisc } = await supabase
        .from('disciplinas')
        .insert({ concurso_id: concursoId, nome: disc.nome, ordem: i })
        .select('id')
        .single()

      if (newDisc && disc.topicos.length > 0) {
        await supabase.from('topicos').insert(
          disc.topicos.map((texto, j) => ({
            disciplina_id: newDisc.id,
            texto,
            ordem: j,
          }))
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('gerar-plano error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
