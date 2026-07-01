import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConcursosComStats } from '@/lib/concursos'
import ConcursosClient from '@/components/ConcursosClient'

export default async function ConcursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await getConcursosComStats(supabase)
  return <ConcursosClient stats={stats} />
}
