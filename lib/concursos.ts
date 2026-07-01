import type { SupabaseClient } from '@supabase/supabase-js'
import type { Concurso } from '@/types'

export interface ConcursoStat {
  concurso: Concurso
  topicoTotal: number
  topicoEstudados: number
  flashcardTotal: number
  flashcardDominados: number
}

export async function getConcursosComStats(supabase: SupabaseClient): Promise<ConcursoStat[]> {
  const { data: concursos } = await supabase
    .from('concursos').select('*').order('created_at', { ascending: false })
  if (!concursos || concursos.length === 0) return []

  const { data: stats } = await supabase
    .from('concurso_stats')
    .select('concurso_id, topicos_total, topicos_estudados, flashcards_total, flashcards_dominados')
    .in('concurso_id', concursos.map(c => c.id))

  const byId = new Map((stats ?? []).map(s => [s.concurso_id, s]))

  return concursos.map(c => {
    const s = byId.get(c.id)
    return {
      concurso: c,
      topicoTotal:        s?.topicos_total ?? 0,
      topicoEstudados:    s?.topicos_estudados ?? 0,
      flashcardTotal:     s?.flashcards_total ?? 0,
      flashcardDominados: s?.flashcards_dominados ?? 0,
    }
  })
}
