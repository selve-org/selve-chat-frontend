'use client'

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

// PostHog disabled - uncomment to re-enable
// if (typeof window !== 'undefined') {
//   const key = process.env.NEXT_PUBLIC_POSTHOG_KEY as string | undefined;
//   
//   if (key) {
//     posthog.init(key, {
//       api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
//       person_profiles: 'identified_only',
//       capture_pageview: false,
//       loaded: (ph) => {
//         if (process.env.NODE_ENV === 'development') ph.debug();
//       },
//     });
//
//     posthog.register({
//       app_name: 'chatbot',
//       app_domain: 'chat.selve.me',
//     });
//   }
// }

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
  
  // PostHog disabled
  // return (
  //   <PHProvider client={posthog}>
  //     <SuspendedPostHogPageView />
  //     {children}
  //   </PHProvider>
  // )
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }
      posthog.capture('$pageview', { '$current_url': url })
    }
  }, [pathname, searchParams])

  return null
}

// Wrap PostHogPageView in Suspense to avoid de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  )
}
