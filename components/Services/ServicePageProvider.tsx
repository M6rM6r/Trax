"use client";
import { LoadingProvider } from "@/contexts/LoadingContext";
import LoadingOverlay from "@/components/shared/LoadingOverlay";
import { ReactNode } from "react";

const ServicePageProvider = ({ children }: { children: ReactNode }) => {
  return (
    <LoadingProvider>
      {children}
      <LoadingOverlay />
    </LoadingProvider>
  );
};

export default ServicePageProvider;
