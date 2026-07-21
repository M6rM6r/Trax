import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DEFAULT_ALLOWED_DOWNLOAD_HOSTS = ["localhost", "127.0.0.1"];
const allowedHosts = (process.env.ALLOWED_DOWNLOAD_HOSTS || "")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);
const effectiveAllowedHosts = new Set([...DEFAULT_ALLOWED_DOWNLOAD_HOSTS, ...allowedHosts]);

function isAllowedHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return Array.from(effectiveAllowedHosts).some(
    (allowed) => normalized === allowed || normalized.endsWith(`.${allowed}`)
  );
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[\\/:*?"<>|\r\n]+/g, "_").slice(0, 255);
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    const filename = sanitizeFilename(req.nextUrl.searchParams.get("filename") || "image.jpg");

    if (!url) {
      return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Only http/https URLs are allowed" }, { status: 400 });
    }

    if (!isAllowedHost(parsedUrl.hostname)) {
      return NextResponse.json({ error: "Host is not allowed" }, { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    // Fetch the image from the remote server
    const response = await fetch(parsedUrl.toString(), {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentLengthHeader = response.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;
    if (
      Number.isFinite(contentLength) &&
      contentLength !== null &&
      contentLength > MAX_FILE_SIZE_BYTES
    ) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image downloads are allowed" }, { status: 415 });
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    // RFC 5987 encoding for filenames with non-ASCII characters (Arabic, etc.)
    // This ensures compatibility with all browsers and proper Arabic filename support
    const encodedFilename = encodeURIComponent(filename);
    const asciiFilename = filename.replace(/[^\x00-\x7F]/g, "_"); // ASCII-only fallback

    // Using both formats for maximum browser compatibility:
    // - filename="..." works for ASCII and is fallback for old browsers
    // - filename*=UTF-8''... is RFC 5987 standard for Unicode filenames
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Upstream request timed out" }, { status: 504 });
    }
    console.error("Download error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
