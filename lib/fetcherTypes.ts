export interface FetcherOptions extends RequestInit {
  headers?: HeadersInit;
  baseUrl?: string; // Allow override
  throwOnError?: boolean; // Control error throwing
  responseType?: "json" | "text" | "blob";
  next?: {
    revalidate?: number;
    tags?: string[];
  };
}

export interface FetcherError extends Error {
  status?: number;
  info?: {
    message?: string;
  };

  response?: Response;
}

export type FetcherConfig = {
  defaultBaseUrl?: string;
  logger?: (error: FetcherError) => void;
};

// Default configuration
export const defaultConfig: FetcherConfig = {
  defaultBaseUrl:
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_API_URL
      : process.env.NEXT_PUBLIC_PRODUCTION_API_URL,
  logger: (error) => console.error("Fetch error:", error),
};
