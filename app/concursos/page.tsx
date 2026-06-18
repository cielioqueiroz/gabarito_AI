import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConcursosClient from '@/components/ConcursosClient'

export default async function ConcursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: concursos } = await supabase
    .from('concursos')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('id, concurso_id')

  const disciplinaIds = (disciplinas ?? []).map(d => d.id)

  const [topicosRes, flashcardsRes] = await Promise.all([
    disciplinaIds.length
      ? supabase.from('topicos').select('disciplina_id, estudado').in('disciplina_id', disciplinaIds)
      : Promise.resolve({ data: [] }),
    disciplinaIds.length
      ? supabase.from('flashcards').select('disciplina_id, box').in('disciplina_id', disciplinaIds)
      : Promise.resolve({ data: [] }),
  ])

  const topicos    = topicosRes.data    ?? []
  const flashcards = flashcardsRes.data ?? []

  const stats = (concursos ?? []).map(c => {
    const cDiscIds   = (disciplinas ?? []).filter(d => d.concurso_id === c.id).map(d => d.id)
    const cTopicos   = topicos.filter(t => cDiscIds.includes(t.disciplina_id))
    const cFlashcards = flashcards.filter(f => cDiscIds.includes(f.disciplina_id))
    return {
      concurso:          c,
      topicoTotal:       cTopicos.length,
      topicoEstudados:   cTopicos.filter(t => t.estudado).length,
      flashcardTotal:    cFlashcards.length,
      flashcardDominados: cFlashcards.filter(f => f.box >= 4).length,
    }
  })

  return <ConcursosClient stats={stats} />
}
