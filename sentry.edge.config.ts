// This file configures the initialization of Sentry for edge features (middleware, edge routes, etc.)
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // PII scrubbing
  beforeSend(event, hint) {
    // Remove user emails
    if (event.user?.email) {
      event.user.email = "***@***.***";
    }

    // Scrub financial data
    if (event.message && typeof event.message === 'string') {
      event.message = event.message.replace(/\$\d+\.\d+/g, "$X.XX");
    }

    return event;
  },
});
