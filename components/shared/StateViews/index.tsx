"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

type SkeletonVariant = "cards" | "table" | "list" | "map" | "chart";

interface LoadingStateProps {
  message?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function LoadingState({ message, icon: _Icon = RefreshCw }: LoadingStateProps) {
  const t = useTranslations("Common.state");
  const resolvedMessage = message ?? t("loading");
  return (
    <Card className="border-0 shadow-lg bg-card" role="status" aria-label={resolvedMessage}>
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <_Icon className="w-8 h-8 text-primary" aria-hidden />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground mb-2">{resolvedMessage}</h3>
      </CardContent>
    </Card>
  );
}

export function LoadingSkeleton({ variant }: { variant: SkeletonVariant }) {
  const t = useTranslations("Common.state");
  if (variant === "cards") {
    return (
      <div
        role="status"
        aria-label={t("loadingAria")}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-lg bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-px w-full mb-4" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <Card className="border-0 shadow-lg bg-card" role="status" aria-label={t("loadingAria")}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted border-input">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border">
                    {Array.from({ length: 6 }).map((_, colIdx) => (
                      <td key={colIdx} className="py-3 px-4">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3" role="status" aria-label={t("loadingAria")}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "map") {
    return (
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        role="status"
        aria-label={t("loadingAria")}
      >
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg overflow-hidden bg-card">
            <Skeleton className="h-[600px] w-full rounded-none" />
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-border"
                  >
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className="space-y-6" role="status" aria-label={t("loadingAria")}>
        <Card className="border-0 shadow-lg bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-64">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <Skeleton
                    className="w-full rounded-t-lg"
                    style={{ height: `${30 + Math.random() * 60}%` }}
                  />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  tip?: string;
  tips?: string[];
  illustration?: "employees" | "attendance" | "geofences" | "ai" | "default";
}

const illustrationConfig: Record<string, { gradient: string; emoji: string }> = {
  employees: {
    gradient: "from-primary/10 to-accent/10",
    emoji: "👥",
  },
  attendance: {
    gradient: "from-primary/10 to-primary/5",
    emoji: "📅",
  },
  geofences: {
    gradient: "from-primary/10 to-primary/5",
    emoji: "📍",
  },
  ai: {
    gradient: "from-accent/10 to-primary/10",
    emoji: "🧠",
  },
  default: {
    gradient: "from-muted to-muted/50",
    emoji: "📭",
  },
};

export function EmptyState({
  icon: _Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tip,
  tips,
  illustration = "default",
}: EmptyStateProps) {
  const t = useTranslations("Common.state");
  const config = illustrationConfig[illustration] ?? illustrationConfig.default;
  const allTips = tips ?? (tip ? [tip] : []);
  return (
    <Card className="border-0 shadow-lg animate-scale-in" role="region" aria-label={title}>
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-6"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-4xl`}
          >
            {config.emoji}
          </motion.div>
        </motion.div>
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg font-bold text-foreground mb-2"
        >
          {title ?? t("emptyTitle")}
        </motion.h3>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mb-6 max-w-sm"
        >
          {description ?? t("emptyDescription")}
        </motion.p>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 flex-wrap justify-center"
        >
          {actionLabel && onAction && (
            <Button
              variant="primary"
              onClick={onAction}
              className="flex items-center gap-2"
              aria-label={actionLabel}
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              className="flex items-center gap-2"
              aria-label={secondaryActionLabel}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
        {allTips.length > 0 && (
          <div className="mt-6 max-w-xs space-y-2">
            {allTips.map((t, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="text-xs text-muted-foreground/70 flex items-start gap-1.5 text-right"
              >
                <span className="shrink-0">💡</span>
                <span>{t}</span>
              </motion.p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  onRetry,
  message,
  retryCount,
  isRetrying,
}: {
  onRetry?: () => void;
  message?: string;
  retryCount?: number;
  isRetrying?: boolean;
}) {
  const t = useTranslations("Common.state");
  return (
    <Card className="border-0 shadow-lg animate-scale-in" role="alert">
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4"
        >
          <AlertCircle className="w-8 h-8 text-destructive" aria-hidden />
        </motion.div>
        <h3 className="text-lg font-bold text-foreground mb-2">{message || t("errorTitle")}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t("errorDescription")}</p>
        {retryCount && retryCount > 0 && (
          <p className="text-xs text-[hsl(48_96%_53%)] mb-3">
            {t("retryAttempt", { count: retryCount })}
          </p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2"
            aria-label={t("retry")}
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden />
            {isRetrying ? t("retrying") : t("retry")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
