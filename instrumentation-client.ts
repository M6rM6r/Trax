// Client-side Sentry bootstrap (Next.js instrumentation-client).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.15 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    enabled:
      process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SENTRY_ENABLE === "true",
  });
}
