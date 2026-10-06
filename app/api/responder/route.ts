import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, checkRateLimit, readJsonObject } from '@/lib/apiHelpers'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  const rl = await checkRateLimit(auth.supabase, auth.userId, 'responder', 120)
  if (rl) return rl

  const body = await readJsonObject(req)
  if (body instanceof NextResponse) return body
  const questaoId = typeof body.questaoId === 'string' ? body.questaoId : ''
  const letra = typeof body.letra === 'string' ? body.letra.trim().toUpperCase() : ''
  if (!questaoId || !['A', 'B', 'C', 'D', 'E'].includes(letra)) {
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

  const correta = String(questao.correta).trim().toUpperCase()
  const acertou = letra === correta

  // Uma linha por (usuário, questão): o estado de "respondida" vivia só no
  // client, então recarregar a página inseria outra linha e inflava as
  // estatísticas. Aqui: se já há resposta, atualiza resultado e data; senão,
  // insere. Não usa ON CONFLICT para não depender do índice único já existir.
  const agora = new Date().toISOString()
  const { data: existente } = await auth.supabase
    .from('respostas')
    .select('id')
    .eq('user_id', auth.userId)
    .eq('questao_id', questao.id)
    .order('respondido_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error: persistErr } = existente
    ? await auth.supabase.from('respostas').update({ acertou, respondido_em: agora }).eq('id', existente.id)
    : await auth.supabase.from('respostas').insert({ user_id: auth.userId, questao_id: questao.id, acertou, respondido_em: agora })
  if (persistErr) {
    return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 })
  }

  return NextResponse.json({ acertou, correta, explicacao: questao.explicacao })
}
