import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from './supabase/server'

export interface Session { supabase: SupabaseClient; user: User }

/**
 * Gate de sessão das páginas. Fica aqui, e não no layout do grupo `(app)`:
 * layouts não re-renderizam a cada navegação (Partial Rendering), então a
 * sessão deixaria de ser checada nas trocas de rota.
 *
 * `cache()` deduplica a chamada dentro da mesma requisição — layout e página
 * podem pedir a sessão sem custo extra.
 */
export const requireSession = cache(async (): Promise<Session> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
})

/** Nome de exibição do usuário, com os fallbacks dos provedores OAuth. */
export function nomeDoUsuario(user: User): string {
  return (user.user_metadata?.full_name ?? user.user_metadata?.name ?? '') as string
}
