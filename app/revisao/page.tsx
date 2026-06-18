import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isDue } from '@/lib/leitner'
import RevisaoClient from '@/components/RevisaoClient'

export default async function RevisaoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: concursos } = await supabase
    .from('concursos').select('id').eq('user_id', user.id)

  const concursoIds = (concursos ?? []).map(c => c.id)
  if (concursoIds.length === 0) {
    return <RevisaoClient flashcards={[]} disciplinaMap={{}} />
  }

  const { data: disciplinas } = await supabase
    .from('disciplinas').select('id, nome').in('concurso_id', concursoIds)

  const disciplinaIds = (disciplinas ?? []).map(d => d.id)

  const { data: flashcards } = disciplinaIds.length
    ? await supabase.from('flashcards').select('*').in('disciplina_id', disciplinaIds)
    : { data: [] }

  const disciplinaMap = Object.fromEntries((disciplinas ?? []).map(d => [d.id, d.nome]))
  const due = (flashcards ?? []).filter(f => isDue(f.prox_revisao))

  return <RevisaoClient flashcards={due} disciplinaMap={disciplinaMap} />
}
