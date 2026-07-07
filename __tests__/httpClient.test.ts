import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { ApiError, httpClient } from "@/lib/services/httpClient";

const originalFetch = global.fetch;

const mockJsonResponse = (status: number, payload: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "ERR",
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
    },
    json: async () => payload,
  }) as unknown as Response;

describe("HttpClient", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    document.cookie = "auth_token=; Max-Age=0; path=/";
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("ApiError", () => {
    it("creates an ApiError with correct properties", () => {
      const error = new ApiError("Not found", 404, "/employees/1");
      expect(error.message).toBe("Not found");
      expect(error.statusCode).toBe(404);
      expect(error.endpoint).toBe("/employees/1");
      expect(error.name).toBe("ApiError");
    });
  });

  describe("httpClient instance", () => {
    it("is defined", () => {
      expect(httpClient).toBeDefined();
    });

    it("has get method", () => {
      expect(typeof httpClient.get).toBe("function");
    });

    it("has post method", () => {
      expect(typeof httpClient.post).toBe("function");
    });

    it("has put method", () => {
      expect(typeof httpClient.put).toBe("function");
    });

    it("has patch method", () => {
      expect(typeof httpClient.patch).toBe("function");
    });

    it("has delete method", () => {
      expect(typeof httpClient.delete).toBe("function");
    });

    it("adds Authorization header from auth_token cookie", async () => {
      document.cookie = `auth_token=${encodeURIComponent("token-123")}; path=/`;

      global.fetch = jest.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        expect((init?.headers as Record<string, string>)?.Authorization).toBe("Bearer token-123");
        return mockJsonResponse(200, { ok: true });
      }) as typeof fetch;

      await httpClient.get("/ping");
    });

    it("does not fallback to localStorage token when cookie is missing", async () => {
      localStorage.setItem("auth-storage", JSON.stringify({ state: { token: "stale-token" } }));

      global.fetch = jest.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        expect((init?.headers as Record<string, string>)?.Authorization).toBeUndefined();
        return mockJsonResponse(200, { ok: true });
      }) as typeof fetch;

      await httpClient.get("/ping");
    });

    it("clears storage and redirects on 401 responses", async () => {
      localStorage.setItem("auth-storage", JSON.stringify({ state: { token: "abc" } }));

      global.fetch = jest.fn(async () =>
        mockJsonResponse(401, { message: "unauthorized" })
      ) as typeof fetch;

      await expect(httpClient.get("/private")).rejects.toBeInstanceOf(ApiError);
      expect(localStorage.getItem("auth-storage")).toBeNull();
      expect(document.cookie).not.toContain("auth_token=");
    });
  });
});
