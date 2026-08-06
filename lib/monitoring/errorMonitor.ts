type ErrorContext = Record<string, string | number | boolean | undefined>;

interface ErrorReport {
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: string;
  url: string;
  userAgent: string;
}

const ERROR_QUEUE: ErrorReport[] = [];
const MAX_QUEUE = 20;
const FLUSH_INTERVAL = 30_000;

class ErrorMonitor {
  private initialized = false;

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    const IGNORED_ERRORS = ["NEXT_REDIRECT", "NEXT_NOT_FOUND", "NEXT_HTTP_ERROR_FALLBACK"];

    window.addEventListener("error", (event) => {
      if (IGNORED_ERRORS.some((e) => event.message?.includes(e))) return;
      this.capture(event.message, {
        stack: event.error?.stack,
        context: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      if (IGNORED_ERRORS.some((e) => message.includes(e))) return;
      this.capture(message, {
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });

    setInterval(() => this.flush(), FLUSH_INTERVAL);
  }

  capture(message: string, opts?: { stack?: string; context?: ErrorContext }) {
    if (typeof window === "undefined") return;

    const report: ErrorReport = {
      message,
      stack: opts?.stack,
      context: opts?.context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    ERROR_QUEUE.push(report);
    if (ERROR_QUEUE.length > MAX_QUEUE) ERROR_QUEUE.shift();

    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorMonitor]", report);
    }

    // Prefer Sentry when DSN is configured (production monitoring).
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs")
        .then((Sentry) => {
          Sentry.captureMessage(report.message, {
            level: "error",
            extra: {
              stack: report.stack,
              ...report.context,
              url: report.url,
            },
          });
        })
        .catch(() => {});
    }
  }

  flush() {
    if (ERROR_QUEUE.length === 0) return;
    const batch = ERROR_QUEUE.splice(0, ERROR_QUEUE.length);

    if (process.env.NODE_ENV === "production") {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        fetch(`${apiUrl}/errors/report`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ errors: batch }),
        }).catch(() => {});
      }
    }
  }
}

export const errorMonitor = new ErrorMonitor();
