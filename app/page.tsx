import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getConcursosComStats } from '@/lib/concursos'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await getConcursosComStats(supabase)
  const userName = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '') as string

  return <HomeClient stats={stats} userEmail={user.email ?? ''} userName={userName} />
}
