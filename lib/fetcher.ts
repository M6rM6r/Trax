// import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import {
  defaultConfig,
  FetcherConfig,
  FetcherError,
  FetcherOptions,
} from "./fetcherTypes";

/**
 * Generic fetch utility for Next.js applications
 * @template T - The expected response type
 * @param url - The endpoint URL
 * @param options - Fetch options with custom extensions
 * @param params - Query parameters
 * @returns Promise<T> - The response data
 */
export const fetcher = async <T = unknown>(
  url: string,
  options: FetcherOptions = {},
  params?: Record<string, string | number>,
  config: FetcherConfig = defaultConfig
): Promise<T> => {
  // const isServer = typeof window === "undefined";
  const authToken = cookies().get("auth_token")?.value;

  // Determine base URL
  const baseUrl = config.defaultBaseUrl ?? "";

  // Construct full URL with query parameters
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  const fullUrl = `${baseUrl}${url}${queryString}`;

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
      cache: options.cache ?? undefined, // Allow cache control
      next: options.next ?? {
        revalidate: options.cache === 'no-store' ? undefined : 300, // Skip revalidate if no-store
      },
    });

    if (!response.ok) {
      const error: FetcherError = new Error(
        `HTTP Error: ${response.status} ${response.statusText}`
      );
      error.status = response.status;
      error.response = response;

      try {
        error.info = await response.json();
      } catch {
        error.info = { message: await response.text() };
      }

      if (config.logger) config.logger(error);
      if (options.throwOnError ?? true) throw error;
      return Promise.reject(error);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return (await response.text()) as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    const fetcherError = error as FetcherError;
    if (config.logger) {
      config.logger({
        ...fetcherError,
        message: fetcherError.message || "Network error occurred",
      });
    }
    throw fetcherError;
  }
};

// Usage example:
// const data = await fetcher<string>('/apiendpoint', { method: 'GET' }, { id: 1 });
