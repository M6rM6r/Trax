"use client";

import { fetcherClient } from "@/lib/fetcherClient";
import { AllEnums } from "@/lib/types/responseTypes";
import { useCallback, useEffect, useState } from "react";

export function useFetchEnums() {
  const [data, setData] = useState<AllEnums>({} as AllEnums);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllEnums = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherClient<AllEnums>("/allEnums");
      setData(res);
    } catch (error: any) {
      setError(error.message || "Failed to fetch enums");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getAllEnums();
  }, [getAllEnums]);

  return { data, loading, error, refetch: getAllEnums };
}
