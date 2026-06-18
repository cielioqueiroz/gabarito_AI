import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConfiguracoesClient from '@/components/ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ConfiguracoesClient
      userId={user.id}
      email={user.email ?? ''}
      initialName={(user.user_metadata?.full_name ?? user.user_metadata?.name ?? '') as string}
    />
  )
}
