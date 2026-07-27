"use client";

import { useCallback } from "react";

interface UsePerformanceTraceReturn {
  startTrace: (name: string) => null;
  measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
}

export function usePerformanceTrace(): UsePerformanceTraceReturn {
  const startTrace = useCallback((_name: string) => null, []);
  const measureAsync = useCallback(async <T>(_name: string, fn: () => Promise<T>): Promise<T> => fn(), []);
  return { startTrace, measureAsync };
}
