import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NumberRecord = Record<string, number>;
export const getSum = (obj: NumberRecord) => Object.values(obj).reduce((sum, val) => sum + val, 0);

export function isTruthy(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  return Boolean(value);
}

export async function blobUrlToFile(blobUrl: string, filename?: string): Promise<File> {
  // fetch works for both remote (https://...) and blob: URLs in the same document
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new File([blob], filename ?? (getFilenameFromUrl(blobUrl) || "file.jpg"), {
    type: blob.type || "application/octet-stream",
  });
}

export function getFirstTwoWords(name: string): string {
  if (!name) return "";
  return name?.split(" ").slice(0, 2).join(" ");
}

/**
 * Accepts: File | Blob | string(remote url or blob url) | null | undefined
 * Returns: File | null
 */
function getFilenameFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    return pathname?.split("/").pop() || null;
  } catch {
    return null;
  }
}

export async function normalizeFile(
  value: string | Blob | File | null | undefined,
  filename = "file.jpg"
): Promise<File | null> {
  if (!value) return null;

  if (value instanceof File) return value;

  if (value instanceof Blob) {
    return new File([value], filename, { type: value.type || "image/jpeg" });
  }

  if (typeof value === "string") {
    try {
      // 🔥 FIX: Remove extra JSON quotes if passed as "\"url\""
      let urlString: string = value;
      if (value.startsWith('"') && value.endsWith('"')) {
        urlString = JSON.parse(value) as string;
      }

      // Convert relative to absolute URL
      const url = urlString.startsWith("http") ? urlString : getFullImageUrl(urlString);

      const res = await fetch(url, { mode: "cors" });

      if (!res.ok) {
        return null;
      }

      const blob = await res.blob();
      let nameFromUrl = getFilenameFromUrl(url) ?? filename;

      if (!/\.[a-zA-Z0-9]+$/.test(nameFromUrl)) {
        const ext = blob.type?.split("/")[1] || "jpg";
        nameFromUrl = `${nameFromUrl}.${ext}`;
      }

      return new File([blob], nameFromUrl, {
        type: blob.type || "image/jpeg",
      });
    } catch {
      return null;
    }
  }

  return null;
}

export const getFullImageUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("http")) return url;

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
};

// File Download Handler
export const handleDownload = (url: string | null, filename: string) => {
  if (!url) return;
  const apiUrl = `/api/download?url=${encodeURIComponent(
    url
  )}&filename=${encodeURIComponent(filename)}`;
  const link = document.createElement("a");
  link.href = apiUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

type DownloadItem = string | Record<string, unknown> | File | Blob | null | undefined;

/**
 * Try to find a URL-like string inside an object (depth-limited DFS).
 */
function findUrlInObject(obj: unknown, depth = 3): string | null {
  if (!obj || depth < 0) return null;

  // quick reject
  if (typeof obj === "string") {
    const s = obj.trim();
    if (/^(https?:\/\/|data:|blob:|\/)/i.test(s)) return s;
    return null;
  }

  // If it's File/Blob => no string url here
  if (obj instanceof File || obj instanceof Blob) return null;

  if (typeof obj !== "object") return null;

  const record = obj as Record<string, unknown>;

  try {
    // check common keys first
    const keys = ["url", "downloadUrl", "fileUrl", "path", "src", "location", "href"];
    for (const k of keys) {
      const v = record[k];
      if (typeof v === "string" && /^(https?:\/\/|data:|blob:|\/)/i.test(v.trim())) {
        return v.trim();
      }
    }

    // then search recursively
    for (const k of Object.keys(record)) {
      const v = record[k];
      if (typeof v === "string" && /^(https?:\/\/|data:|blob:|\/)/i.test(v.trim())) {
        return v.trim();
      }
      if (typeof v === "object" && v !== null) {
        const found = findUrlInObject(v, depth - 1);
        if (found) return found;
      }
    }
  } catch {
    // ignore and continue
  }
  return null;
}

/**
 * Create an anchor, click it then cleanup. Returns a promise that resolves when click is done.
 */
function triggerDownloadFromUrl(href: string, filename: string) {
  return new Promise<void>((resolve) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename || "";
    a.style.display = "none";
    document.body.appendChild(a);

    // Some browsers require the element to be in DOM before clicking
    a.click();

    // cleanup after a tick (give browser a moment to start download)
    setTimeout(() => {
      document.body.removeChild(a);
      resolve();
    }, 500);
  });
}

/**
 * Main enhanced download handler.
 *
 * - Accepts strings, objects, File/Blob
 * - Extracts URL from object when possible
 * - Creates object URLs for File/Blob and for JSON fallback
 * - Uses a proxy endpoint (/api/download) only when we have a remote URL string
 */
export const handleDownloadFiles = async (
  urls: DownloadItem[] | DownloadItem | null,
  filenames?: (string | undefined)[]
) => {
  if (!urls) return;

  const urlList = Array.isArray(urls) ? urls : [urls];
  const nameList =
    filenames && filenames.length === urlList.length
      ? filenames
      : urlList.map((_, i) => `file_${i + 1}`);

  // store object URLs we created so we can revoke later
  const createdObjectUrls: string[] = [];

  try {
    // Map to promises so downloads start in parallel
    await Promise.all(
      urlList.map(async (item, index) => {
        const suggestedName = nameList[index] ?? `file_${index + 1}`;

        // 1) If item is a string — treat as direct remote URL
        if (typeof item === "string") {
          const remoteUrl = item.trim();
          if (!remoteUrl) {
            console.warn(`Empty URL at index ${index}`);
            return;
          }

          // If it looks like an absolute remote URL (http/https) or data/blob/local path
          if (/^https?:\/\//i.test(remoteUrl)) {
            // Use server proxy to avoid CORS and to set Content-Disposition properly
            const apiUrl = `/api/download?url=${encodeURIComponent(
              remoteUrl
            )}&filename=${encodeURIComponent(suggestedName)}`;

            const res = await fetch(apiUrl);
            if (!res.ok) {
              console.error(`Failed to fetch remote file: ${res.status}`, await res.text());
              return;
            }
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            createdObjectUrls.push(blobUrl);
            await triggerDownloadFromUrl(blobUrl, suggestedName);
            return;
          }

          // data: or blob: or relative path -> try direct download
          if (/^(data:|blob:|\/)/i.test(remoteUrl)) {
            await triggerDownloadFromUrl(remoteUrl, suggestedName);
            return;
          }

          // fallback: treat as relative -> try using proxy
          const apiUrl = `/api/download?url=${encodeURIComponent(
            remoteUrl
          )}&filename=${encodeURIComponent(suggestedName)}`;
          const res = await fetch(apiUrl);
          if (!res.ok) {
            console.error(`Failed to fetch remote file (fallback): ${res.status}`);
            return;
          }
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          createdObjectUrls.push(blobUrl);
          await triggerDownloadFromUrl(blobUrl, suggestedName);
          return;
        }

        // 2) If item is File or Blob -> createObjectURL and download directly
        if (item instanceof File || item instanceof Blob) {
          const blobUrl = window.URL.createObjectURL(item);
          createdObjectUrls.push(blobUrl);
          await triggerDownloadFromUrl(blobUrl, suggestedName);
          return;
        }

        // 3) item is an object -> try to extract a url-like string
        if (typeof item === "object" && item !== null) {
          const extracted = findUrlInObject(item);
          if (extracted) {
            // handle extracted URL same as string case
            if (/^https?:\/\//i.test(extracted)) {
              const apiUrl = `/api/download?url=${encodeURIComponent(
                extracted
              )}&filename=${encodeURIComponent(suggestedName)}`;
              const res = await fetch(apiUrl);
              if (!res.ok) {
                console.error(`Failed to fetch extracted URL: ${res.status}`);
                return;
              }
              const blob = await res.blob();
              const blobUrl = window.URL.createObjectURL(blob);
              createdObjectUrls.push(blobUrl);
              await triggerDownloadFromUrl(blobUrl, suggestedName);
              return;
            }

            // data/blob/local path
            await triggerDownloadFromUrl(extracted, suggestedName);
            return;
          }

          // 4) No URL found inside object -> create a JSON file fallback so item is still downloadable
          console.warn(`No URL found in object at index ${index}. Creating JSON file download.`);
          const jsonStr = JSON.stringify(item, null, 2);
          const blob = new Blob([jsonStr], { type: "application/json" });
          const blobUrl = window.URL.createObjectURL(blob);
          createdObjectUrls.push(blobUrl);

          // ensure filename has .json extension
          const filenameWithExt = suggestedName.endsWith(".json")
            ? suggestedName
            : `${suggestedName}.json`;

          await triggerDownloadFromUrl(blobUrl, filenameWithExt);
          return;
        }

        // any other type -> ignore with a log
        console.warn(`Unsupported download item type at index ${index}:`, item);
      })
    );
  } catch (err) {
    console.error("Error while downloading files:", err);
    alert("حدث خطأ أثناء تحميل الملفات");
  } finally {
    // revoke created object URLs to avoid memory leaks (delay a touch to ensure browser started)
    setTimeout(() => {
      createdObjectUrls.forEach((u) => {
        try {
          window.URL.revokeObjectURL(u);
        } catch {}
      });
    }, 2000);
  }
};

// Getting a key of key-value pairs object by label
export const getKeyByLabel = (label: string, enumObj: Record<string, string>) => {
  return Object.entries(enumObj).find(([_key, val]) => val === label)?.[0] ?? null;
};
