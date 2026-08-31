import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, assertDisciplinaOwnership, readJsonObject } from '@/lib/apiHelpers'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const body = await readJsonObject(req)
  if (body instanceof NextResponse) return body
  const disciplinaId = typeof body.disciplinaId === 'string' ? body.disciplinaId : ''
  const frente = typeof body.frente === 'string' ? body.frente.trim().slice(0, 5000) : ''
  const verso = typeof body.verso === 'string' ? body.verso.trim().slice(0, 5000) : ''
  if (!disciplinaId || !frente || !verso) {
    return NextResponse.json({ error: 'disciplinaId, frente e verso são obrigatórios' }, { status: 400 })
  }
  if (!(await assertDisciplinaOwnership(auth.supabase, auth.userId, disciplinaId))) {
    return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 })
  }

  const { data, error } = await auth.supabase
    .from('flashcards')
    .insert({ disciplina_id: disciplinaId, frente, verso, box: 1, prox_revisao: new Date().toISOString() })
    .select('*').single()
  if (error) return NextResponse.json({ error: 'Erro ao criar card' }, { status: 500 })
  return NextResponse.json(data)
}
