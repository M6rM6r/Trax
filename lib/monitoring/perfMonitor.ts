interface PerfMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function rateMetric(name: string, value: number): PerfMetric["rating"] {
  const t = THRESHOLDS[name];
  if (!t) return "good";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

class PerfMonitor {
  private initialized = false;
  private metrics: PerfMetric[] = [];

  init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    if ("PerformanceObserver" in window) {
      this.observeLCP();
      this.observeCLS();
      this.observeFCP();
      this.observeTTFB();
    }

    window.addEventListener("load", () => {
      setTimeout(() => this.report(), 1000);
    });
  }

  private observeLCP() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const value = lastEntry.startTime;
      this.metrics.push({ name: "LCP", value, rating: rateMetric("LCP", value) });
    }).observe({ type: "largest-contentful-paint", buffered: true });
  }

  private observeCLS() {
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value || 0;
        }
      }
      this.metrics.push({ name: "CLS", value: clsValue, rating: rateMetric("CLS", clsValue) });
    }).observe({ type: "layout-shift", buffered: true });
  }

  private observeFCP() {
    new PerformanceObserver((list) => {
      const entry = list.getEntries()[0];
      if (entry) {
        const value = entry.startTime;
        this.metrics.push({ name: "FCP", value, rating: rateMetric("FCP", value) });
      }
    }).observe({ type: "paint", buffered: true });
  }

  private observeTTFB() {
    const navEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navEntry) {
      const value = navEntry.responseStart;
      this.metrics.push({ name: "TTFB", value, rating: rateMetric("TTFB", value) });
    }
  }

  private report() {
    const unique = new Map<string, PerfMetric>();
    for (const m of this.metrics) unique.set(m.name, m);

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.table(Array.from(unique.values()));
    }

    if (process.env.NODE_ENV === "production") {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        fetch(`${apiUrl}/metrics/web`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metrics: Array.from(unique.values()) }),
        }).catch(() => {});
      }
    }
  }

  getMetrics(): PerfMetric[] {
    return [...this.metrics];
  }
}

export const perfMonitor = new PerfMonitor();
