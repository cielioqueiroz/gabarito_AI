import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPublic = path === '/login'
                  || path === '/sobre'
                  || path === '/redefinir-senha'
                  || path.startsWith('/auth/')   // OAuth / email PKCE code exchange
                  || path.startsWith('/api/')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // Skip auth for Next.js internals and public metadata assets (favicon, PWA
  // manifest, social/OG images). Without this, crawlers hitting /opengraph-image
  // get bounced to /login and link previews break.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|manifest.json|opengraph-image|twitter-image|sitemap.xml|robots.txt).*)',
  ],
}
