import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AttendanceSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="جاري تحميل الحضور">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar skeleton */}
      <Card className="border-0 shadow-sm bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border">
                    {Array.from({ length: 5 }).map((_, colIdx) => (
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
    </div>
  );
}
