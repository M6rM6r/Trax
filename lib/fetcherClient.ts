import { getCookie } from "cookies-next";
import {
  defaultConfig,
  FetcherConfig,
  FetcherError,
  FetcherOptions,
} from "./fetcherTypes";

/**
 * Generic fetch utility for Next.js client components
 * @template T - The expected response type
 * @param url - The endpoint URL
 * @param options - Fetch options with custom extensions
 * @param params - Query parameters
 * @returns Promise<T> - The response data
 */
export const fetcherClient = async <T = unknown>(
  url: string,
  options: FetcherOptions = {},
  params?: Record<string, string | number>,
  config: FetcherConfig = defaultConfig
): Promise<T> => {
  // Get auth token from localStorage or document.cookie
  const authToken = getCookie("auth_token");

  // Determine base URL
  const baseUrl = options.baseUrl || config.defaultBaseUrl || "";

  // Construct full URL with query parameters
  const queryString = params
    ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
    : "";
  const fullUrl = `${baseUrl}${url}${queryString}`;

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        Accept:
          options.responseType === "blob"
            ? "application/octet-stream"
            : "application/json",
        "Access-Control-Allow-Origin": "*",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
      cache: options.cache ?? "force-cache", // Cache by default for better performance
      next: options.next ?? { revalidate: 300 }, // ISR: Revalidate every 5 minutes
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

    // Handle different response types
    if (options.responseType === "blob") {
      return (await response.blob()) as T;
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
