/**
 * After App Hosting / Next deploys, open tabs keep an old HTML shell that
 * references hashed chunks that no longer exist (404 → MIME text/html → ChunkLoadError).
 * One hard reload (with a short session lock) recovers without infinite loops.
 */

const RELOAD_KEY = "trax:chunk-reload";
const RELOAD_TTL_MS = 30_000;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { name?: string; message?: string };
  const name = String(err.name ?? "");
  const message = String(err.message ?? error);
  return (
    name === "ChunkLoadError" ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /ChunkLoadError/i.test(message) ||
    /Failed to fetch RSC payload/i.test(message) ||
    /Loading CSS chunk [\w-]+ failed/i.test(message) ||
    (/\/_next\/static\//i.test(message) && /failed/i.test(message))
  );
}

function recentlyReloaded(): boolean {
  if (!isBrowser()) return false;
  try {
    const raw = sessionStorage.getItem(RELOAD_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < RELOAD_TTL_MS;
  } catch {
    return false;
  }
}

function markReload(): void {
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/**
 * @returns true if a reload was triggered
 */
export function recoverFromChunkLoadError(error?: unknown): boolean {
  if (!isBrowser()) return false;
  if (error !== null && error !== undefined && !isChunkLoadError(error)) return false;
  if (recentlyReloaded()) return false;
  markReload();
  // Cache-bust navigation so SW/HTML shell is not reused.
  const url = new URL(window.location.href);
  url.searchParams.set("_trax_r", String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

/** Install once: unhandledrejection + error for dynamic import failures. */
export function installChunkLoadRecovery(): () => void {
  if (!isBrowser()) return () => {};

  const onError = (event: ErrorEvent) => {
    const msg = event.message || "";
    const target = event.target as HTMLElement | null;
    const src = target && "src" in target ? String((target as HTMLScriptElement).src || "") : "";
    if (isChunkLoadError({ message: msg }) || (src.includes("/_next/static/") && event.message)) {
      if (recoverFromChunkLoadError({ name: "ChunkLoadError", message: msg || src })) {
        event.preventDefault();
      }
    }
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    if (isChunkLoadError(reason)) {
      if (recoverFromChunkLoadError(reason)) {
        event.preventDefault();
      }
    }
  };

  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError, true);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
