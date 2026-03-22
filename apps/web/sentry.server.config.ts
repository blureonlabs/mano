import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,

  beforeSend(event) {
    // Never send encrypted clinical data to Sentry
    if (event.extra) {
      delete event.extra.noteContent;
      delete event.extra.treatmentPlan;
    }
    return event;
  },
});
