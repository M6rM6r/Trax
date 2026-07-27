"use client";

import { memo, useMemo } from "react";
import { Clock } from "lucide-react";

interface PeakHoursHeatmapProps {
  data: Array<{ hour: string; count: number }>;
}

const PeakHoursHeatmap = memo(({ data }: PeakHoursHeatmapProps) => {
  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  const getHeatColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio === 0) return "bg-muted/50";
    if (ratio < 0.25) return "bg-primary/10";
    if (ratio < 0.5) return "bg-primary/30";
    if (ratio < 0.75) return "bg-primary/50 dark:bg-primary/70";
    return "bg-primary/70";
  };

  const getTextColor = (count: number) => {
    const ratio = count / maxCount;
    return ratio >= 0.5 ? "text-primary-foreground" : "text-muted-foreground";
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">ساعات الذروة</h3>
          <p className="text-sm text-muted-foreground">توزيع أوقات الحضور والانصراف</p>
        </div>
      </div>
      <div
        className="grid grid-cols-7 sm:grid-cols-14 gap-1.5"
        role="img"
        aria-label="خريطة حرارية لساعات الذروة"
      >
        {data.map((item) => (
          <div
            key={item.hour}
            className={`h-16 rounded-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 cursor-default ${getHeatColor(item.count)} ${getTextColor(item.count)}`}
            title={`${item.hour}: ${item.count} موظف`}
          >
            <span className="text-[10px] font-medium opacity-80">{item.hour}</span>
            <span className="text-sm font-bold">{item.count}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>أقل</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-muted/50" />
          <div className="w-4 h-4 rounded bg-primary/10" />
          <div className="w-4 h-4 rounded bg-primary/30" />
          <div className="w-4 h-4 rounded bg-primary/50 dark:bg-primary/70" />
          <div className="w-4 h-4 rounded bg-primary/70" />
        </div>
        <span>أكثر</span>
      </div>
    </div>
  );
});

PeakHoursHeatmap.displayName = "PeakHoursHeatmap";
export default PeakHoursHeatmap;
