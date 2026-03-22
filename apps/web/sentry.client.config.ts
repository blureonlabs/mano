import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Performance monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session replay for debugging
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  // Filter out noisy errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "Load failed",
    "ChunkLoadError",
  ],

  // Don't send PII
  beforeSend(event) {
    // Strip any clinical data from error reports
    if (event.extra) {
      delete event.extra.noteContent;
      delete event.extra.treatmentPlan;
      delete event.extra.diagnosis;
    }
    return event;
  },
});
