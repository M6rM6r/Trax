import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type QueryConstraint,
  type DocumentSnapshot,
  type Query,
} from "firebase/firestore";
import { requireDb } from "./helpers";

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Paginated query helper — fetches a page of documents with cursor-based pagination.
 * Uses startAfter with the last document snapshot from the previous page.
 */
export async function paginatedQuery<T>(
  collectionName: string,
  options: {
    companyId?: string;
    constraints?: QueryConstraint[];
    pageSize?: number;
    cursor?: DocumentSnapshot | null;
    mapper: (id: string, data: Record<string, unknown>) => T;
  }
): Promise<PaginatedResult<T>> {
  const db = requireDb();
  const pageSize = options.pageSize ?? 20;

  const constraints: QueryConstraint[] = [];

  if (options.companyId) {
    constraints.push(where("company_id", "==", options.companyId));
  }

  if (options.constraints) {
    constraints.push(...options.constraints);
  }

  constraints.push(limit(pageSize + 1)); // Fetch one extra to check hasMore

  if (options.cursor) {
    constraints.push(startAfter(options.cursor));
  }

  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;
  const lastDoc = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

  const data = pageDocs.map((doc) => options.mapper(doc.id, doc.data() as Record<string, unknown>));

  return { data, lastDoc, hasMore };
}

/**
 * Infinite scroll helper — returns a fetch function that loads the next page.
 */
export function createInfiniteLoader<T>(
  collectionName: string,
  options: {
    companyId?: string;
    constraints?: QueryConstraint[];
    pageSize?: number;
    mapper: (id: string, data: Record<string, unknown>) => T;
  }
) {
  let cursor: DocumentSnapshot | null = null;
  let exhausted = false;

  return async function loadMore(): Promise<PaginatedResult<T>> {
    if (exhausted) {
      return { data: [], lastDoc: null, hasMore: false };
    }

    const result = await paginatedQuery<T>(collectionName, {
      ...options,
      cursor,
    });

    cursor = result.lastDoc;
    if (!result.hasMore) {
      exhausted = true;
    }

    return result;
  };
}
