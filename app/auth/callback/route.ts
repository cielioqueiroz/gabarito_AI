import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// Mensagem única mostrada ao usuário. O detalhe do provedor/Supabase fica no log
// do servidor — refletido na query string, vazava texto interno na URL e na tela.
const ERRO_GENERICO = 'Não foi possível concluir o acesso. Tente novamente.'

// OAuth (Google) and email links (confirmação de cadastro, recuperação de
// senha) all use Supabase's PKCE flow: the provider redirects back here with a
// `?code`, which MUST be exchanged for a session server-side. Without this
// route the code is never exchanged, the session cookie is never set, and the
// proxy bounces the user back to /login — which is exactly the "erro ao entrar
// com Google" symptom.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Provider-side failure (e.g. usuário cancelou o consentimento do Google).
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  if (error) {
    logger.warn('auth-callback', 'provider-error', { err: String(errorDescription || error).slice(0, 160) })
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(ERRO_GENERICO)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      // Behind Vercel's proxy the trustworthy host is x-forwarded-host, not the
      // internal `origin`. Fall back to origin locally.
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocal = process.env.NODE_ENV === 'development'
      const base = isLocal ? origin : forwardedHost ? `https://${forwardedHost}` : origin
      // Only allow same-app relative redirects to avoid open-redirect abuse.
      const safeNext = next.startsWith('/') ? next : '/'
      return NextResponse.redirect(`${base}${safeNext}`)
    }
    logger.warn('auth-callback', 'exchange-error', { err: exchangeError.message.slice(0, 160) })
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(ERRO_GENERICO)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Link inválido ou expirado.')}`)
}
