import { requireSession, nomeDoUsuario } from '@/lib/auth'
import { getConcursosComStats } from '@/lib/concursos'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  const { supabase, user } = await requireSession()

  const stats = await getConcursosComStats(supabase)

  return <HomeClient stats={stats} userEmail={user.email ?? ''} userName={nomeDoUsuario(user)} />
}
