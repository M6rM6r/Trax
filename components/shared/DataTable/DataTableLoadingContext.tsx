"use client";

import React, { createContext, useContext, useState, useTransition, useMemo } from "react";

interface DataTableLoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
}

const DataTableLoadingContext = createContext<DataTableLoadingContextType | undefined>(
  undefined
);

export function DataTableLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const value = useMemo(
    () => ({
      isLoading: isLoading || isPending,
      setIsLoading,
      isPending,
      startTransition,
    }),
    [isLoading, isPending]
  );

  return (
    <DataTableLoadingContext.Provider value={value}>
      {children}
    </DataTableLoadingContext.Provider>
  );
}

export function useDataTableLoading() {
  const context = useContext(DataTableLoadingContext);
  if (context === undefined) {
    throw new Error("useDataTableLoading must be used within a DataTableLoadingProvider");
  }
  return context;
}
