import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EstatisticasClient from '@/components/EstatisticasClient'

export default async function EstatisticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: respostas }, { data: discStats }, { data: concursoStats }, { data: concursos }] = await Promise.all([
    supabase.from('respostas').select('acertou, respondido_em, questao_id, questoes(disciplina_id, disciplinas(concurso_id))').order('respondido_em', { ascending: false }).limit(500),
    supabase.from('disciplina_stats').select('*'),
    supabase.from('concurso_stats').select('*'),
    supabase.from('concursos').select('id, nome').order('created_at', { ascending: false }),
  ])

  type Row = { acertou: boolean; respondido_em: string; questao_id: string; questoes: { disciplina_id: string; disciplinas: { concurso_id: string } | null } | null }
  const resp = ((respostas ?? []) as unknown as Row[]).map(r => ({
    acertou: r.acertou,
    respondido_em: r.respondido_em,
    concurso_id: r.questoes?.disciplinas?.concurso_id ?? null,
  }))

  return (
    <EstatisticasClient
      respostas={resp}
      disciplinaStats={discStats ?? []}
      concursoStats={concursoStats ?? []}
      concursos={concursos ?? []}
    />
  )
}
