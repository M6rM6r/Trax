// This file configures the initialization of Sentry for edge features (middleware, edge routes).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLE === "true",
  });
}
