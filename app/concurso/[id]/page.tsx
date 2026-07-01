import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConcursoDetail from '@/components/ConcursoDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConcursoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: concurso } = await supabase
    .from('concursos')
    .select('*')
    .eq('id', id)
    .single()

  if (!concurso) notFound()

  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('*')
    .eq('concurso_id', id)
    .order('ordem')

  const disciplinaIds = (disciplinas ?? []).map(d => d.id)

  const [topicosRes, flashcardsRes, questoesRes] = await Promise.all([
    disciplinaIds.length
      ? supabase.from('topicos').select('*').in('disciplina_id', disciplinaIds).order('ordem')
      : Promise.resolve({ data: [] }),
    disciplinaIds.length
      ? supabase.from('flashcards').select('*').in('disciplina_id', disciplinaIds).order('created_at')
      : Promise.resolve({ data: [] }),
    disciplinaIds.length
      ? supabase.from('questoes').select('id, disciplina_id, enunciado, alternativas, dificuldade, tags, created_at').in('disciplina_id', disciplinaIds).order('created_at')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <ConcursoDetail
      concurso={concurso}
      disciplinas={disciplinas ?? []}
      topicos={topicosRes.data ?? []}
      flashcards={flashcardsRes.data ?? []}
      questoes={questoesRes.data ?? []}
    />
  )
}
