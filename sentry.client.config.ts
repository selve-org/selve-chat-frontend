// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // PII scrubbing
  beforeSend(event, hint) {
    // Remove user emails
    if (event.user?.email) {
      event.user.email = "***@***.***";
    }

    // Scrub financial data
    const scrubFinancialData = (text: string) => {
      if (typeof text !== 'string') return text;
      return text.replace(/\$\d+\.\d+/g, "$X.XX");
    };

    if (event.message) {
      event.message = scrubFinancialData(event.message);
    }

    if (event.exception?.values) {
      event.exception.values.forEach(exception => {
        if (exception.value) {
          exception.value = scrubFinancialData(exception.value);
        }
      });
    }

    return event;
  },

  // Ignore common non-critical errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    "Network request failed",
  ],
});
