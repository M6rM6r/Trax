"use client";

import { memo, useMemo, useCallback } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface AttendancePieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  }>;
}

const AttendancePieChart = memo(({ data }: AttendancePieChartProps) => {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const safeTotal = total || 1;

  const CustomTooltip = useCallback(
    ({
      active,
      payload,
    }: {
      active?: boolean;
      payload?: Array<{ payload: AttendancePieChartProps["data"][number] }>;
    }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
              <p className="font-bold text-foreground">{data.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              العدد: <span className="font-semibold">{data.value.toLocaleString("en-US")}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((data.value / safeTotal) * 100).toFixed(1)}% من الإجمالي
            </p>
          </div>
        );
      }
      return null;
    },
    [safeTotal]
  );

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <PieChartIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">توزيع الحضور</h3>
          <p className="text-sm text-muted-foreground">نسبة كل حالة من الإجمالي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="relative">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="text-center">
              <div className="text-2xl font-black text-foreground">
                {total.toLocaleString("en-US")}
              </div>
              <div className="text-xs font-medium text-muted-foreground">الإجمالي</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item) => {
            const Icon = item.icon;
            const percentage = ((item.value / safeTotal) * 100).toFixed(1);
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:shadow-md hover:scale-[1.02] transition-all duration-200 bg-card cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{percentage}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">
                    {item.value.toLocaleString("en-US")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

AttendancePieChart.displayName = "AttendancePieChart";
export default AttendancePieChart;
