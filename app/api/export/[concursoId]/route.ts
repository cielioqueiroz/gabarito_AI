import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, assertConcursoOwnership } from '@/lib/apiHelpers'

export const runtime = 'nodejs'

function escapeField(v: string): string {
  // Anki TSV: replace tabs and newlines to keep one card per line.
  return v.replace(/\t/g, ' ').replace(/\r?\n/g, '<br>')
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ concursoId: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { concursoId } = await params

  if (!(await assertConcursoOwnership(auth.supabase, auth.userId, concursoId))) {
    return NextResponse.json({ error: 'Concurso não encontrado' }, { status: 404 })
  }

  const { data: discs } = await auth.supabase
    .from('disciplinas').select('id, nome').eq('concurso_id', concursoId)
  if (!discs || discs.length === 0) {
    return new Response('', { headers: { 'Content-Type': 'text/tab-separated-values' } })
  }
  const discNames = new Map(discs.map(d => [d.id, d.nome]))

  const { data: cards } = await auth.supabase
    .from('flashcards').select('frente, verso, disciplina_id').in('disciplina_id', discs.map(d => d.id))

  const lines = (cards ?? []).map(c => {
    const tag = (discNames.get(c.disciplina_id) ?? '').replace(/\s+/g, '_')
    return [escapeField(c.frente), escapeField(c.verso), tag].join('\t')
  })
  const body = ['#separator:tab', '#html:true', '#tags column:3', ...lines].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Content-Disposition': `attachment; filename="gabarito-${concursoId}.txt"`,
    },
  })
}
