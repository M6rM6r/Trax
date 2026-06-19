import { fetcherClient } from "@/lib/fetcherClient";
import { useCallback, useEffect, useState } from "react";

export function useFetchModelName<T>(name: string, filters?: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModelName = useCallback(async () => {
    if (!name) return; // Skip fetch if name is empty
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherClient<T>(
        `/modelDDLList?model_name=${encodeURIComponent(name)}&${filters}`
      );
      setData(res);
    } catch (error: any) {
      setError(error.message || "Failed to fetch model name");
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchModelName();
  }, [fetchModelName]);

  return { data, loading, error, refetch: fetchModelName };
}
