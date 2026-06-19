/**
 * Request Deduplication Utility
 * Prevents duplicate API calls for the same endpoint within a short time window
 */

interface CachedRequest {
  promise: Promise<any>;
  timestamp: number;
}

const requestCache = new Map<string, CachedRequest>();
const CACHE_DURATION = 5000; // 5 seconds

/**
 * Deduplicate API requests
 * If the same request is made within the cache duration, return the cached promise
 * @param key - Unique key for the request (usually the URL)
 * @param fetcher - Function that makes the actual API call
 * @returns Promise with the response
 */
export async function deduplicateRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = requestCache.get(key);

  // Return cached promise if it's still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.promise;
  }

  // Create new request
  const promise = fetcher();

  // Store in cache
  requestCache.set(key, {
    promise,
    timestamp: now,
  });

  // Clean up cache after duration
  setTimeout(() => {
    requestCache.delete(key);
  }, CACHE_DURATION);

  return promise;
}

/**
 * Clear the entire request cache
 */
export function clearRequestCache(): void {
  requestCache.clear();
}

/**
 * Clear a specific request from cache
 */
export function clearRequestFromCache(key: string): void {
  requestCache.delete(key);
}
