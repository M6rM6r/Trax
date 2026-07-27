import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployeeListSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="جاري تحميل الموظفين">
      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3 flex-wrap">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <div className="flex-1" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <Card className="border-0 shadow-lg bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="py-3 px-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-border">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-2 w-16" />
                        </div>
                      </div>
                    </td>
                    {Array.from({ length: 5 }).map((_, colIdx) => (
                      <td key={colIdx} className="py-3 px-4">
                        <Skeleton className="h-4 w-full max-w-[100px]" />
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
