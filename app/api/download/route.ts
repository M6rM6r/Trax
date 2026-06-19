import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    const filename = req.nextUrl.searchParams.get("filename") || "image.jpg";

    if (!url) {
      return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    }

    // Fetch the image from the remote server
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.statusText}` },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

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
    console.error("Download error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
