"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import type { ComponentType } from "react";

type SkeletonVariant = "cards" | "table" | "list" | "map";

export function LoadingSkeleton({ variant }: { variant: SkeletonVariant }) {
  if (variant === "cards") {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      <Card className="border-0 shadow-lg dark:bg-slate-800">
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
      <div className="space-y-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

  return null;
}

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "لا توجد بيانات",
  description = "لم يتم العثور على أي سجلات",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-0 shadow-lg animate-scale-in">
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{description}</p>
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction} className="flex items-center gap-2">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="border-0 shadow-lg animate-scale-in">
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-2">
          حدث خطأ أثناء تحميل البيانات
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">يرجى المحاولة مرة أخرى</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
