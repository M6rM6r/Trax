import { logger } from "@/lib/config/logger";
import { auth } from "@/lib/config/firebase";
import { getIdToken } from "firebase/auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatusCodes: Set<number>;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
};

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response;

class HttpClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseUrl: string, retryConfig?: Partial<RetryConfig>) {
    this.baseUrl = baseUrl;
    this.retryConfig = { ...DEFAULT_RETRY, ...retryConfig };
  }

  addRequestInterceptor(fn: RequestInterceptor): void {
    this.requestInterceptors.push(fn);
  }

  addResponseInterceptor(fn: ResponseInterceptor): void {
    this.responseInterceptors.push(fn);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let result = config;
    for (const fn of this.requestInterceptors) {
      result = await fn(result);
    }
    return result;
  }

  private applyResponseInterceptors(response: Response): Response {
    return this.responseInterceptors.reduce((acc, fn) => fn(acc), response);
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith("http")) return endpoint;
    return `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, attempt = 1): Promise<T> {
    const config = await this.applyRequestInterceptors({
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      _endpoint: endpoint,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any); // _endpoint used by interceptors to skip auth on public routes

    const url = this.buildUrl(endpoint);

    try {
      logger.debug(`HTTP ${config.method || "GET"} ${endpoint}`, { attempt });

      const response = await fetch(url, config);
      const intercepted = this.applyResponseInterceptors(response);

      if (!intercepted.ok) {
        const shouldRetry =
          attempt < this.retryConfig.maxRetries &&
          this.retryConfig.retryableStatusCodes.has(intercepted.status);

        if (shouldRetry) {
          const delay = this.retryConfig.retryDelay * Math.pow(2, attempt - 1);
          logger.warn(`Retrying ${endpoint} after ${delay}ms (attempt ${attempt + 1})`, {
            status: intercepted.status,
          });
          await this.sleep(delay);
          return this.request<T>(endpoint, options, attempt + 1);
        }

        const errorBody = await intercepted.json().catch(() => ({}));
        throw new ApiError(
          errorBody.message || `Request failed with status ${intercepted.status}`,
          intercepted.status,
          endpoint,
          errorBody
        );
      }

      const data = await intercepted.json();
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError("Request aborted", 0, endpoint);
      }

      const shouldRetry = attempt < this.retryConfig.maxRetries;
      if (shouldRetry) {
        const delay = this.retryConfig.retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`Network error, retrying ${endpoint} after ${delay}ms`, { attempt });
        await this.sleep(delay);
        return this.request<T>(endpoint, options, attempt + 1);
      }

      throw new ApiError(
        error instanceof Error ? error.message : "Unknown network error",
        0,
        endpoint
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const httpClient = new HttpClient(apiUrl, {
  maxRetries: 3,
  retryDelay: 800,
});

httpClient.addRequestInterceptor(async (config) => {
  if (typeof document !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const endpoint: string = (config as any)._endpoint ?? "";
    const isAuthEndpoint =
      endpoint.includes("auth/firebase") ||
      endpoint.includes("auth/register") ||
      endpoint.includes("auth/forgot") ||
      endpoint.includes("auth/reset");
    if (isAuthEndpoint) return config;

    // Refresh Firebase ID token before each authenticated request to avoid 1-hour expiry.
    let token: string | null = null;
    try {
      if (auth?.currentUser) {
        token = await getIdToken(auth.currentUser, false);
      }
    } catch {
      // Fallback to persisted token if refresh fails.
    }

    if (!token) {
      try {
        const stored = localStorage.getItem("auth-storage");
        if (stored) {
          const parsed = JSON.parse(stored) as { state?: { token?: string } };
          token = parsed?.state?.token ?? null;
        }
      } catch {
        // ignore
      }
    }

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
});

httpClient.addResponseInterceptor((response) => {
  if (response.status === 401 && typeof window !== "undefined") {
    const onLoginPage = window.location.pathname.includes("/login");
    if (onLoginPage) return response;

    logger.warn("Unauthorized — redirecting to login");
    try {
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("trax_emp_creds");
    } catch {
      // ignore storage cleanup failures
    }
    const isJsDom =
      typeof navigator !== "undefined" &&
      typeof navigator.userAgent === "string" &&
      navigator.userAgent.toLowerCase().includes("jsdom");

    if (!isJsDom) {
      const pathParts = window.location.pathname.split("/");
      const detectedLocale = pathParts[1] === "en" ? "en" : "ar";
      window.location.href = `/${detectedLocale}/login`;
    }
  }
  return response;
});
