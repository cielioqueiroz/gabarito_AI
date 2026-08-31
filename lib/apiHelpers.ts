import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from './supabase/server'
import { rateLimit } from './rateLimit'
import { logger } from './logger'

export interface AuthContext { supabase: SupabaseClient; userId: string }

export async function readJsonObject(req: Request): Promise<Record<string, unknown> | NextResponse> {
  try {
    const body: unknown = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('corpo inválido')
    return body as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Corpo JSON inválido' }, { status: 400 })
  }
}

export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return { supabase, userId: user.id }
}

export async function checkRateLimit(supabase: SupabaseClient, userId: string, scope: string, max = 10) {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_scope: scope,
  })
  if (!error && Array.isArray(data) && data[0]) {
    const resultado = data[0] as { allowed: boolean; retry_after: number }
    if (!resultado.allowed) {
      return NextResponse.json({ error: 'Muitas requisições. Tente em breve.' }, {
        status: 429,
        headers: { 'Retry-After': String(resultado.retry_after) },
      })
    }
    return null
  }

  if (error) logger.warn('rate-limit', 'fallback-memoria', { err: error.message.slice(0, 160) })
  const rl = rateLimit(`${userId}:${scope}`, max)
  if (!rl.ok) return NextResponse.json({ error: 'Muitas requisições. Tente em breve.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
  return null
}

export async function assertDisciplinaOwnership(supabase: SupabaseClient, userId: string, disciplinaId: string): Promise<boolean> {
  return !!(await getOwnedDisciplina(supabase, userId, disciplinaId))
}

export async function getOwnedDisciplina(supabase: SupabaseClient, userId: string, disciplinaId: string): Promise<{ id: string; nome: string } | null> {
  const { data } = await supabase
    .from('disciplinas')
    .select('id, nome, concursos!inner(user_id)')
    .eq('id', disciplinaId)
    .eq('concursos.user_id', userId)
    .maybeSingle()
  return data ? { id: data.id, nome: data.nome } : null
}

export async function assertConcursoOwnership(supabase: SupabaseClient, userId: string, concursoId: string): Promise<boolean> {
  const { data } = await supabase
    .from('concursos').select('id').eq('id', concursoId).eq('user_id', userId).maybeSingle()
  return !!data
}
