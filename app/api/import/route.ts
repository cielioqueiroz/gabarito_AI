import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, checkRateLimit, assertDisciplinaOwnership } from '@/lib/apiHelpers'

export const runtime = 'nodejs'

const MAX_LINES = 500

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = checkRateLimit(auth.userId, 'import-deck', 5)
  if (rl) return rl

  const { disciplinaId, content } = await req.json()
  if (!disciplinaId || typeof content !== 'string') {
    return NextResponse.json({ error: 'disciplinaId e content são obrigatórios' }, { status: 400 })
  }
  if (!(await assertDisciplinaOwnership(auth.supabase, auth.userId, disciplinaId))) {
    return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })
  }

  const lines = content.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#')).slice(0, MAX_LINES)
  const rows = lines
    .map(l => {
      const parts = l.includes('\t') ? l.split('\t') : l.split(';')
      const [frente, verso] = parts
      return frente?.trim() && verso?.trim()
        ? { disciplina_id: disciplinaId, frente: frente.trim(), verso: verso.trim(), box: 1, prox_revisao: new Date().toISOString() }
        : null
    })
    .filter(Boolean)

  if (rows.length === 0) return NextResponse.json({ error: 'Nenhum card válido' }, { status: 400 })
  const { error } = await auth.supabase.from('flashcards').insert(rows as object[])
  if (error) return NextResponse.json({ error: 'Erro ao importar' }, { status: 500 })
  return NextResponse.json({ count: rows.length })
}
