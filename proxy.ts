import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Check if user has __session cookie from Clerk (set by main app)
  const sessionCookie = request.cookies.get('__session')

  // Main app URL for authentication (trim to remove any trailing newlines)
  const mainAppUrl = (
    process.env.NEXT_PUBLIC_MAIN_APP_URL ||
    process.env.MAIN_APP_URL ||
    process.env.MAIN_APP_URL_PROD ||
    'http://localhost:3000'
  ).trim()

  // If no session, redirect to main app's auth redirect handler
  if (!sessionCookie) {
    const chatbotUrl = (
      process.env.NEXT_PUBLIC_CHATBOT_URL ||
      process.env.CHATBOT_URL_PROD ||
      'http://localhost:4000'
    ).trim()
    const loginUrl = new URL('/auth/redirect', mainAppUrl)
    loginUrl.searchParams.set('redirect_to', chatbotUrl)

    return NextResponse.redirect(loginUrl)
  }

  // Session exists, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
