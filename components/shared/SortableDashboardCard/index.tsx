"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, TrendingUp } from "lucide-react";
import { memo } from "react";
import { CountUp } from "@/components/shared/CountUp";
import Link from "next/link";
import * as Tooltip from "@radix-ui/react-tooltip";

export interface DashboardCardData {
  id: string;
  title: string;
  value: number;
  detailsPageUrl: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  trend?: number;
}

interface SortableDashboardCardProps {
  stat: DashboardCardData;
}

export const SortableDashboardCard = memo(function SortableDashboardCard({
  stat,
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
      className={`relative group ${isDragging ? "ring-2 ring-ring rounded-xl z-50" : ""}`}
      {...attributes}
      role="article"
      aria-label={`${stat.title}: ${stat.value}`}
    >
      <button
        className="absolute top-3 left-3 z-20 p-1 rounded-md bg-muted/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        aria-label="سحب لإعادة الترتيب"
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <Link
        href={stat.detailsPageUrl}
        className="block rounded-xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-input hover:bg-muted/50 hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
          {stat.trend !== undefined && (
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full cursor-default ${
                      stat.trend >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    <TrendingUp className={`w-3 h-3 ${stat.trend < 0 ? "rotate-180" : ""}`} />
                    <span>{Math.abs(stat.trend)}%</span>
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    sideOffset={6}
                    className="rounded-lg bg-muted text-primary-foreground text-xs px-3 py-1.5 shadow-lg z-50"
                  >
                    {stat.trend >= 0 ? "زيادة" : "انخفاض"} {Math.abs(stat.trend)}%
                    <Tooltip.Arrow className="fill-slate-700" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
        </div>

        <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
        <p className="text-3xl font-bold text-foreground">
          <CountUp end={stat.value} duration={1200} />
        </p>
      </Link>
    </div>
  );
});
