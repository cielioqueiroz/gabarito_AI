import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiHelpers'

export const runtime = 'nodejs'

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  // Cards vencidos = flashcards do usuário com prox_revisao <= agora.
  // RLS filtra automaticamente por dono via join implícito na policy.
  const { count } = await auth.supabase
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .lte('prox_revisao', new Date().toISOString())

  return NextResponse.json({ count: count ?? 0 }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
