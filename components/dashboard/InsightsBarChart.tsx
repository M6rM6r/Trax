"use client";

import { memo, useMemo, useState } from "react";
import { BarChart4 } from "lucide-react";

interface InsightsBarChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

const InsightsBarChart = memo(({ data }: InsightsBarChartProps) => {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/50 flex items-center justify-center">
          <BarChart4 className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">مقارنة الحضور</h3>
          <p className="text-sm text-muted-foreground">مقارنة مرئية بين الحالات المختلفة</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={item.name}
              className="space-y-2 relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-muted-foreground text-sm">{item.name}</span>
                <span className="font-bold text-foreground">
                  {item.value.toLocaleString("en-US")}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                    boxShadow: `0 2px 4px ${item.color}40`,
                    transform: isHovered ? "scaleY(1.3)" : "scaleY(1)",
                  }}
                />
              </div>
              {isHovered && (
                <div className="absolute right-0 -top-8 bg-muted text-primary-foreground text-xs px-2 py-1 rounded-md shadow-lg pointer-events-none z-10">
                  {((item.value / data.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

InsightsBarChart.displayName = "InsightsBarChart";
export default InsightsBarChart;
