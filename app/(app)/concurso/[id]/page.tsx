import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import ConcursoDetail from '@/components/ConcursoDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ConcursoPage({ params }: Props) {
  const { id } = await params
  const { supabase } = await requireSession()

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

  const [topicosRes, flashcardsRes, questoesRes, resumosRes] = await Promise.all([
    disciplinaIds.length
      ? supabase.from('topicos').select('*').in('disciplina_id', disciplinaIds).order('ordem')
      : Promise.resolve({ data: [] }),
    disciplinaIds.length
      ? supabase.from('flashcards').select('*').in('disciplina_id', disciplinaIds).order('created_at')
      : Promise.resolve({ data: [] }),
    disciplinaIds.length
      ? supabase.from('questoes')
          // `correta` e `explicacao` NÃO saem daqui: só via /api/responder,
          // depois que o usuário escolhe uma alternativa.
          .select('id, disciplina_id, enunciado, alternativas, dificuldade, tags, origem, numero, topico, created_at')
          .in('disciplina_id', disciplinaIds)
          // Questão de prova segue a numeração original; o resto, ordem de criação.
          .order('numero', { ascending: true, nullsFirst: false })
          .order('created_at')
      : Promise.resolve({ data: [] }),
    disciplinaIds.length
      ? supabase.from('resumos').select('*').in('disciplina_id', disciplinaIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  return (
    <ConcursoDetail
      concurso={concurso}
      disciplinas={disciplinas ?? []}
      topicos={topicosRes.data ?? []}
      flashcards={flashcardsRes.data ?? []}
      questoes={questoesRes.data ?? []}
      resumos={resumosRes.data ?? []}
    />
  )
}
