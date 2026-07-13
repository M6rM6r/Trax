"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import type { ComponentType } from "react";
import { motion } from "framer-motion";

type SkeletonVariant = "cards" | "table" | "list" | "map" | "chart";

interface LoadingStateProps {
  message?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function LoadingState({
  message = "جاري التحميل...",
  icon: _Icon = RefreshCw,
}: LoadingStateProps) {
  return (
    <Card className="border-0 shadow-lg dark:bg-slate-800" role="status" aria-label={message}>
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4"
        >
          <_Icon className="w-8 h-8 text-blue-500 dark:text-blue-400" aria-hidden />
        </motion.div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-2">{message}</h3>
      </CardContent>
    </Card>
  );
}

export function LoadingSkeleton({ variant }: { variant: SkeletonVariant }) {
  if (variant === "cards") {
    return (
      <div
        role="status"
        aria-label="جاري التحميل"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-lg dark:bg-slate-800">
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
      <Card
        className="border-0 shadow-lg dark:bg-slate-800"
        role="status"
        aria-label="جاري التحميل"
      >
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:bg-slate-700 dark:border-slate-600">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-100">
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
      <div className="space-y-3" role="status" aria-label="جاري التحميل">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700"
          >
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
        aria-label="جاري التحميل"
      >
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg overflow-hidden dark:bg-slate-800">
            <Skeleton className="h-[600px] w-full rounded-none" />
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg dark:bg-slate-800">
            <CardContent className="pt-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-700"
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
      <div className="space-y-6" role="status" aria-label="جاري التحميل">
        <Card className="border-0 shadow-lg dark:bg-slate-800">
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
    gradient: "from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20",
    emoji: "👥",
  },
  attendance: {
    gradient: "from-green-100 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20",
    emoji: "📅",
  },
  geofences: {
    gradient: "from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20",
    emoji: "📍",
  },
  ai: {
    gradient: "from-purple-100 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-900/20",
    emoji: "🧠",
  },
  default: {
    gradient: "from-gray-100 to-slate-100 dark:from-slate-700 dark:to-slate-800",
    emoji: "📭",
  },
};

export function EmptyState({
  icon: _Icon = Inbox,
  title = "لا توجد بيانات",
  description = "لم يتم العثور على أي سجلات",
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  tip,
  tips,
  illustration = "default",
}: EmptyStateProps) {
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
          className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-2"
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-sm"
        >
          {description}
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
                className="text-xs text-gray-400 dark:text-slate-500 flex items-start gap-1.5 text-right"
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
  return (
    <Card className="border-0 shadow-lg animate-scale-in" role="alert">
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4"
        >
          <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" aria-hidden />
        </motion.div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-2">
          {message || "حدث خطأ أثناء تحميل البيانات"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">يرجى المحاولة مرة أخرى</p>
        {retryCount && retryCount > 0 && (
          <p className="text-xs text-amber-500 dark:text-amber-400 mb-3">
            المحاولة {retryCount} من 3
          </p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2"
            aria-label="إعادة المحاولة"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} aria-hidden />
            {isRetrying ? "جاري إعادة المحاولة..." : "إعادة المحاولة"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
