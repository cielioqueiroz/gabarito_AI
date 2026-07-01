import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EstatisticasClient from '@/components/EstatisticasClient'

export default async function EstatisticasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: respostas }, { data: discStats }, { data: concursoStats }] = await Promise.all([
    supabase.from('respostas').select('acertou, respondido_em').order('respondido_em', { ascending: false }).limit(500),
    supabase.from('disciplina_stats').select('*'),
    supabase.from('concurso_stats').select('*'),
  ])

  return (
    <EstatisticasClient
      respostas={respostas ?? []}
      disciplinaStats={discStats ?? []}
      concursoStats={concursoStats ?? []}
    />
  )
}
