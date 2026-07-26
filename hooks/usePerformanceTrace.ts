"use client";

import { useCallback } from "react";
import { trace, type PerformanceTrace } from "firebase/performance";
import { performance } from "@/lib/config/firebase";

interface UsePerformanceTraceReturn {
  startTrace: (name: string) => PerformanceTrace | null;
  measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
}

export function usePerformanceTrace(): UsePerformanceTraceReturn {
  const startTrace = useCallback((name: string): PerformanceTrace | null => {
    if (!performance) return null;
    try {
      return trace(performance, name);
    } catch {
      return null;
    }
  }, []);

  const measureAsync = useCallback(async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    if (!performance) return fn();
    const t = trace(performance, name);
    t.start();
    try {
      const result = await fn();
      t.stop();
      return result;
    } catch (err) {
      t.putMetric("error", 1);
      t.stop();
      throw err;
    }
  }, []);

  return { startTrace, measureAsync };
}
