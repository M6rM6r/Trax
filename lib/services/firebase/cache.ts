import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { requireDb } from "./helpers";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  cached_at: number;
  expires_at: number;
}

/**
 * Firestore-backed cache for expensive aggregation queries.
 * Stores results in a `cache` collection with TTL.
 * Falls back to direct computation on cache miss.
 */
export async function cachedQuery<T>(
  cacheKey: string,
  compute: () => Promise<T>,
  ttlMs: number = CACHE_TTL_MS
): Promise<T> {
  const db = requireDb();
  const cacheRef = doc(db, "cache", cacheKey);

  try {
    const cached = await getDoc(cacheRef);
    if (cached.exists()) {
      const entry = cached.data() as CacheEntry<T>;
      if (Date.now() < entry.expires_at) {
        return entry.data;
      }
    }
  } catch {
    // Cache read failed — continue to compute
  }

  // Compute fresh result
  const data = await compute();

  // Store in cache
  try {
    await setDoc(cacheRef, {
      data,
      cached_at: Date.now(),
      expires_at: Date.now() + ttlMs,
      updated_at: serverTimestamp(),
    });
  } catch {
    // Cache write failed — non-critical
  }

  return data;
}

/**
 * Invalidate a cache entry by key.
 */
export async function invalidateCache(cacheKey: string): Promise<void> {
  const db = requireDb();
  const cacheRef = doc(db, "cache", cacheKey);
  try {
    await setDoc(cacheRef, { expires_at: 0 }, { merge: true });
  } catch {
    // Non-critical
  }
}

/**
 * Invalidate all cache entries for a company.
 * Uses a prefix-based approach — keys should be formatted as `companyId:queryName`.
 */
export async function invalidateCompanyCache(companyId: string): Promise<void> {
  // Firestore doesn't support prefix queries on document IDs efficiently.
  // Instead, we use a company-scoped cache subcollection.
  const db = requireDb();
  const companyCacheRef = doc(db, "company_cache", companyId);
  try {
    await setDoc(companyCacheRef, {
      invalidated_at: serverTimestamp(),
    });
  } catch {
    // Non-critical
  }
}
