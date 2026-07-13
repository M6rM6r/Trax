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
    if (ratio === 0) return "bg-gray-100 dark:bg-slate-700/50";
    if (ratio < 0.25) return "bg-blue-100 dark:bg-blue-900/30";
    if (ratio < 0.5) return "bg-blue-300 dark:bg-blue-700/50";
    if (ratio < 0.75) return "bg-blue-500 dark:bg-blue-600/70";
    return "bg-blue-700 dark:bg-blue-500";
  };

  const getTextColor = (count: number) => {
    const ratio = count / maxCount;
    return ratio >= 0.5 ? "text-white" : "text-gray-700 dark:text-slate-300";
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">ساعات الذروة</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">توزيع أوقات الحضور والانصراف</p>
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
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500 dark:text-slate-400">
        <span>أقل</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-slate-700/50" />
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30" />
          <div className="w-4 h-4 rounded bg-blue-300 dark:bg-blue-700/50" />
          <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600/70" />
          <div className="w-4 h-4 rounded bg-blue-700 dark:bg-blue-500" />
        </div>
        <span>أكثر</span>
      </div>
    </div>
  );
});

PeakHoursHeatmap.displayName = "PeakHoursHeatmap";
export default PeakHoursHeatmap;
