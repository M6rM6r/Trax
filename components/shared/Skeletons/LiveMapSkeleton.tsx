import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function LiveMapSkeleton() {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      role="status"
      aria-label="Loading live map"
    >
      {/* Map skeleton */}
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-lg overflow-hidden bg-card">
          <Skeleton className="h-[600px] w-full rounded-none" />
        </Card>
      </div>

      {/* Sidebar skeleton */}
      <div className="space-y-4">
        <Card className="border-0 shadow-lg bg-card">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-card">
          <CardContent className="pt-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border"
                >
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
