import { NextRequest, NextResponse } from 'next/server'

/**
 * Toll Gate Middleware
 *
 * Checks for Clerk session cookie (__session) and redirects to main app
 * for authentication if not present.
 */
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')

  // Allow access if session cookie exists
  if (sessionCookie) {
    return NextResponse.next()
  }

  // No session - redirect to main app for authentication
  const mainAppUrl = (
    process.env.NEXT_PUBLIC_MAIN_APP_URL ||
    process.env.MAIN_APP_URL ||
    process.env.MAIN_APP_URL_PROD ||
    'http://localhost:3000'
  ).trim()

  const chatbotUrl = (
    process.env.NEXT_PUBLIC_CHATBOT_URL ||
    process.env.CHATBOT_URL_PROD ||
    'http://localhost:4000'
  ).trim()

  // Construct redirect URL to main app's auth/redirect page
  const loginUrl = new URL('/auth/redirect', mainAppUrl)
  loginUrl.searchParams.set('redirect_to', chatbotUrl)

  return NextResponse.redirect(loginUrl)
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - monitoring (Sentry tunnel route)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|monitoring).*)',
  ],
}
