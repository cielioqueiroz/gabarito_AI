import { requireSession } from '@/lib/auth'
import { getConcursosComStats } from '@/lib/concursos'
import ConcursosClient from '@/components/ConcursosClient'

export default async function ConcursosPage() {
  const { supabase } = await requireSession()

  const stats = await getConcursosComStats(supabase)
  return <ConcursosClient stats={stats} />
}
