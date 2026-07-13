"use client";

import { useState, useCallback, useRef } from "react";
import { retryWithBackoff } from "@/lib/utils/retry";

export function useRetryableQuery<T>(
  queryFn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    onRetry?: (attempt: number) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      const result = await retryWithBackoff(queryFn, {
        maxRetries: options?.maxRetries ?? 3,
        onRetry: (attempt) => {
          setRetryCount(attempt);
          options?.onRetry?.(attempt);
        },
      });
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
      return result;
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
      return null;
    }
  }, [queryFn, options]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setError(null);
    setRetryCount(0);
    setIsLoading(false);
  }, []);

  return { execute, reset, isLoading, error, retryCount };
}
