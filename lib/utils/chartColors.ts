export const CHART_COLORS = {
  present: "#16A34A",
  late: "#F59E0B",
  absent: "#DC2626",
  primary: "#3B82F6",
  secondary: "#8B5CF6",
  accent: "#EC4899",
  info: "#06B6D4",
  warning: "#F97316",
} as const;

export const CHART_COLOR_PALETTE = [
  CHART_COLORS.present,
  CHART_COLORS.late,
  CHART_COLORS.absent,
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.info,
  CHART_COLORS.warning,
];

export const CHART_TOOLTIP_STYLES = {
  className:
    "bg-white dark:bg-slate-800 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xl",
} as const;
