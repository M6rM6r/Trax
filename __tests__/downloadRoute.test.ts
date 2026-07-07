/** @jest-environment node */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import type { NextRequest } from "next/server";
import { GET } from "@/app/api/download/route";

const mockResponse = (status: number, headers: Record<string, string>, body: string) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "ERR",
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? null,
    },
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  }) as unknown as Response;

describe("download route security", () => {
  const originalEnv = process.env.ALLOWED_DOWNLOAD_HOSTS;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.ALLOWED_DOWNLOAD_HOSTS = "cdn.example.com";
    jest.restoreAllMocks();
  });

  afterEach(() => {
    process.env.ALLOWED_DOWNLOAD_HOSTS = originalEnv;
    global.fetch = originalFetch;
  });

  it("rejects disallowed host", async () => {
    const request = {
      nextUrl: new URL("http://localhost/api/download?url=https://evil.com/a.jpg"),
    } as unknown as NextRequest;

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("rejects non-image content type", async () => {
    global.fetch = jest.fn(async () =>
      mockResponse(200, { "content-type": "text/plain", "content-length": "5" }, "hello")
    ) as typeof fetch;

    const request = {
      nextUrl: new URL("http://localhost/api/download?url=https://localhost/file.txt"),
    } as unknown as NextRequest;

    const response = await GET(request);
    expect(response.status).toBe(415);
  });
});
