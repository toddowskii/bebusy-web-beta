import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/signup' || path === '/create-profile' || path === '/banned'

  // Get the token from cookies
  const token = request.cookies.get('sb-access-token')?.value || ''

  // Redirect to login if accessing protected route without token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if user is banned - check for ALL routes when authenticated
  if (token) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      
      if (userError) {
        console.error('Middleware: Error getting user:', userError)
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
