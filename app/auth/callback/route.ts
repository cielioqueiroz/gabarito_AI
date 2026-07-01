import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const msg = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
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
    const msg = encodeURIComponent(exchangeError.message)
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Link inválido ou expirado.')}`)
}
