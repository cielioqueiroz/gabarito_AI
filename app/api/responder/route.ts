import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, checkRateLimit } from '@/lib/apiHelpers'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = checkRateLimit(auth.userId, 'responder', 120)
  if (rl) return rl

  const { questaoId, letra } = await req.json()
  if (!questaoId || typeof letra !== 'string') {
    return NextResponse.json({ error: 'questaoId e letra são obrigatórios' }, { status: 400 })
  }

  const { data: questao, error } = await auth.supabase
    .from('questoes')
    .select('id, correta, explicacao')
    .eq('id', questaoId)
    .maybeSingle()

  if (error || !questao) {
    return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
  }

  const acertou = letra === questao.correta

  const { error: insertErr } = await auth.supabase
    .from('respostas').insert({ user_id: auth.userId, questao_id: questao.id, acertou })
  if (insertErr) {
    return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 })
  }

  return NextResponse.json({ acertou, correta: questao.correta, explicacao: questao.explicacao })
}
