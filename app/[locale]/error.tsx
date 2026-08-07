"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { isChunkLoadError, recoverFromChunkLoadError } from "@/lib/utils/chunkLoadRecovery";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");
  const chunkError = isChunkLoadError(error);

  useEffect(() => {
    if (recoverFromChunkLoadError(error)) return;
    console.error("Page error:", error);
    console.error("Page error details:", {
      message: error?.message,
      stack: error?.stack,
      stringified: JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})),
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">
          {chunkError ? t("updateAvailable") : t("pageError")}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {chunkError ? t("updateAvailableHint") : error.message}
        </p>
        <button
          onClick={() => {
            if (chunkError) {
              window.location.reload();
              return;
            }
            reset();
          }}
          className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          {chunkError ? t("reloadPage") : t("retry")}
        </button>
      </div>
    </div>
  );
}
