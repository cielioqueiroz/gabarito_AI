import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const { frente, verso } = await req.json()

  const update: Record<string, string> = {}
  if (typeof frente === 'string' && frente.trim()) update.frente = frente.trim()
  if (typeof verso === 'string' && verso.trim())   update.verso  = verso.trim()
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  const { data, error } = await auth.supabase
    .from('flashcards').update(update).eq('id', id).select('*').single()
  if (error || !data) return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const { error } = await auth.supabase.from('flashcards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
