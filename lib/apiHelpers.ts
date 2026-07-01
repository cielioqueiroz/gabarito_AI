import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './supabase/server'
import { rateLimit } from './rateLimit'

export interface AuthContext { supabase: SupabaseClient; userId: string }

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return { supabase, userId: user.id }
}

export function checkRateLimit(userId: string, scope: string, max = 10) {
  const rl = rateLimit(`${userId}:${scope}`, max)
  if (!rl.ok) return NextResponse.json({ error: 'Muitas requisições. Tente em breve.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
  return null
}

export async function assertDisciplinaOwnership(supabase: SupabaseClient, userId: string, disciplinaId: string): Promise<boolean> {
  const { data } = await supabase
    .from('disciplinas')
    .select('id, concursos!inner(user_id)')
    .eq('id', disciplinaId)
    .eq('concursos.user_id', userId)
    .maybeSingle()
  return !!data
}

export async function assertConcursoOwnership(supabase: SupabaseClient, userId: string, concursoId: string): Promise<boolean> {
  const { data } = await supabase
    .from('concursos').select('id').eq('id', concursoId).eq('user_id', userId).maybeSingle()
  return !!data
}
