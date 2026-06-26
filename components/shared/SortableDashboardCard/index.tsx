"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, TrendingUp, ArrowRight } from "lucide-react";
import { memo } from "react";
import { CountUp } from "@/components/shared/CountUp";
import Link from "next/link";

export interface DashboardCardData {
  id: string;
  title: string;
  value: number;
  detailsPageUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  iconBg: string;
  trend?: number;
  sparklineData?: number[];
}

function MiniSparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const w = 80;
  const h = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  const last = data[data.length - 1];
  const lastX = w;
  const lastY = h - ((last - min) / range) * (h - 6) - 3;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="opacity-60">
      <polyline
        points={pts}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

interface SortableDashboardCardProps {
  stat: DashboardCardData;
  locale: string;
}

export const SortableDashboardCard = memo(function SortableDashboardCard({
  stat,
  locale: _locale,
}: SortableDashboardCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stat.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = stat.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "ring-2 ring-blue-400 rounded-xl z-50" : ""}`}
      {...attributes}
    >
      <button
        className="absolute top-3 left-3 z-20 p-1 rounded-md bg-gray-100 dark:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        aria-label="سحب لإعادة الترتيب"
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
      </button>
      <div className="relative rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600">
        <div className={`absolute top-0 right-0 w-1 h-full rounded-r-xl ${stat.accentColor}`} />

        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          {stat.trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                stat.trend >= 0
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
              }`}
            >
              <TrendingUp className={`w-3 h-3 ${stat.trend < 0 ? "rotate-180" : ""}`} />
              <span>{Math.abs(stat.trend)}%</span>
            </div>
          )}
        </div>

        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{stat.title}</p>

        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
            <CountUp end={stat.value} duration={1200} />
          </p>
          {stat.sparklineData && stat.sparklineData.length >= 2 && (
            <MiniSparkline
              data={stat.sparklineData}
              color={
                stat.accentColor.includes("blue")
                  ? "#3b82f6"
                  : stat.accentColor.includes("emerald") || stat.accentColor.includes("green")
                    ? "#10b981"
                    : stat.accentColor.includes("amber") || stat.accentColor.includes("orange")
                      ? "#f59e0b"
                      : stat.accentColor.includes("red") || stat.accentColor.includes("rose")
                        ? "#ef4444"
                        : "#6366f1"
              }
            />
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
          <Link
            href={stat.detailsPageUrl}
            className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span>عرض التفاصيل</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
});
