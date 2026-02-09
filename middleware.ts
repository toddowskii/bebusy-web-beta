import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  // Add reset and update password pages so unauthenticated users can access the reset flow
  const isPublicPath = path === '/login' || path === '/signup' || path === '/create-profile' || path === '/banned' || path === '/reset-password' || path === '/update-password'

  // Get the token from cookies (prefer access token, fallback to refresh token)
  const accessToken = request.cookies.get('sb-access-token')?.value
  const refreshToken = request.cookies.get('sb-refresh-token')?.value
  const token = accessToken || refreshToken || ''

  // Redirect to login if accessing protected route without token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if user is banned - check for ALL routes when authenticated
  // Be defensive: don't call Supabase if token is clearly invalid to avoid AuthSessionMissingError
  if (token && typeof token === 'string' && token.length > 20) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      let user = null

      try {
        const resp = await supabase.auth.getUser(token)
        // Some runtimes throw; others return an object with error
        if (resp?.data?.user) user = resp.data.user
        if ((resp as any)?.error) {
          // Treat missing session as non-fatal and skip detailed logging
          const err = (resp as any).error
          if (err?.name === 'AuthSessionMissingError' || err?.message?.includes('Auth session missing')) {
            console.debug('Middleware: No valid auth session found for token (skipping auth checks)')
            // If this request requires authentication, clear cookies and redirect to login
            if (!isPublicPath) {
              const res = NextResponse.redirect(new URL('/login', request.url))
              res.cookies.delete('sb-access-token')
              res.cookies.delete('sb-refresh-token')
              return res
            }
          } else {
            console.warn('Middleware: Error getting user:', err)
          }
        }
      } catch (err: any) {
        // Supabase client may throw on missing session; handle gracefully
        if (err?.name === 'AuthSessionMissingError' || err?.message?.includes('Auth session missing')) {
          console.debug('Middleware: No valid auth session found for token (skipping auth checks)')
          if (!isPublicPath) {
            const res = NextResponse.redirect(new URL('/login', request.url))
            res.cookies.delete('sb-access-token')
            res.cookies.delete('sb-refresh-token')
            return res
          }
        } else {
          console.warn('Middleware: Error getting user (caught):', err)
        }
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, banned_until')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Middleware: Error fetching profile:', profileError)
        }

        console.log('Middleware: User role:', profile?.role, 'Path:', path)

        if (profile?.role === 'banned') {
          // Check if ban has expired
          if (profile.banned_until && new Date(profile.banned_until) < new Date()) {
            console.log('Middleware: Ban expired, auto-unbanning')
            // Auto-unban expired users
            await supabase
              .from('profiles')
              .update({ role: 'user', bio: null, banned_until: null })
              .eq('id', user.id)
          } else {
            console.log('Middleware: User is banned, redirecting to /banned')
            // User is still banned - only allow /banned page
            if (path !== '/banned') {
              return NextResponse.redirect(new URL('/banned', request.url))
            }
            // If already on /banned, let them stay there
            return NextResponse.next()
          }
        }
      }
    } catch (error) {
      console.error('Middleware auth check error:', error)
    }
  } else {
    // If token is too short, just skip auth checks (likely invalid or empty)
    if (token) console.debug('Middleware: Received token but it appears invalid - skipping auth checks')
  }

  // Redirect to home if accessing login/signup pages with token (and not banned)
  if ((path === '/login' || path === '/signup') && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
