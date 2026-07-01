import { NextRequest, NextResponse } from 'next/server'
import { anthropicClient, CLAUDE_MODEL, MAX_EDITAL_CHARS } from '@/lib/anthropic'
import { requireAuth, checkRateLimit, assertConcursoOwnership } from '@/lib/apiHelpers'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = checkRateLimit(auth.userId, 'stream-plano', 5)
  if (rl) return rl

  const { texto, concursoId } = await req.json()
  if (!texto || !concursoId) return NextResponse.json({ error: 'texto e concursoId obrigatórios' }, { status: 400 })
  if (!(await assertConcursoOwnership(auth.supabase, auth.userId, concursoId))) {
    return NextResponse.json({ error: 'Concurso não encontrado' }, { status: 404 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const client = anthropicClient()
      const iter = await client.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: 'Você organiza editais em disciplinas e tópicos. Produza a resposta como um texto legível: linhas começando com "# " são disciplinas, linhas com "- " são tópicos.',
        messages: [{ role: 'user', content: `Organize o edital abaixo em disciplinas (# nome) e tópicos (- texto). Conteúdo: ${String(texto).slice(0, MAX_EDITAL_CHARS)}` }],
      })
      for await (const event of iter) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
