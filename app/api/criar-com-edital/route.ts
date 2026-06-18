import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

function parseJSON(raw: string) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

async function extractText(file: File): Promise<string> {
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text()
  }

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfModule = await import('pdf-parse')
    const pdfParse = (pdfModule as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default ?? pdfModule
    const data = await pdfParse(buffer)
    return data.text
  }

  throw new Error('Formato não suportado. Use PDF ou TXT.')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const formData = await req.formData()
    const nome = formData.get('nome') as string
    const cargo = formData.get('cargo') as string | null
    const banca = formData.get('banca') as string | null
    const ano = formData.get('ano') as string | null
    const file = formData.get('edital') as File | null

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Criar concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .insert({
        user_id: user.id,
        nome: nome.trim(),
        cargo: cargo?.trim() || null,
        banca: banca?.trim() || null,
        ano: ano?.trim() || null,
      })
      .select('id')
      .single()

    if (concursoError || !concurso) {
      return NextResponse.json({ error: 'Erro ao criar concurso' }, { status: 500 })
    }

    // Se não tem arquivo, retorna só o concurso criado
    if (!file || file.size === 0) {
      return NextResponse.json({ id: concurso.id, gerou: false })
    }

    // Extrair texto do arquivo
    const texto = await extractText(file)

    if (!texto.trim()) {
      return NextResponse.json({ id: concurso.id, gerou: false, aviso: 'Arquivo sem texto extraível' })
    }

    // Gerar plano com IA
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: 'Você organiza editais de concurso em plano de estudos estruturado. Responda APENAS com JSON válido, sem markdown.',
      messages: [
        {
          role: 'user',
          content: `A partir deste conteúdo programático, gere um plano de estudos agrupado em disciplinas e tópicos. Formato: {"disciplinas":[{"nome":"...","topicos":["...","..."]}]}. Conteúdo: ${texto.slice(0, 12000)}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed: { disciplinas: { nome: string; topicos: string[] }[] } = parseJSON(raw)

    // Salvar disciplinas e tópicos
    for (let i = 0; i < parsed.disciplinas.length; i++) {
      const disc = parsed.disciplinas[i]
      const { data: newDisc } = await supabase
        .from('disciplinas')
        .insert({ concurso_id: concurso.id, nome: disc.nome, ordem: i })
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

    return NextResponse.json({ id: concurso.id, gerou: true, disciplinas: parsed.disciplinas.length })
  } catch (err: unknown) {
    console.error('criar-com-edital error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
