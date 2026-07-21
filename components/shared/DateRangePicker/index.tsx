"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { hapticTap } from "@/lib/utils/haptics";

export type DateRangePreset = "today" | "7days" | "30days" | "month" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  from: Date;
  to: Date;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presetOptions: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "7days", label: "آخر 7 أيام" },
  { value: "30days", label: "آخر 30 يوم" },
  { value: "month", label: "هذا الشهر" },
  { value: "custom", label: "مخصص" },
];

function getPresetRange(preset: DateRangePreset): { from: Date; to: Date } {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: now, to: now };
    case "7days":
      return { from: subDays(now, 7), to: now };
    case "30days":
      return { from: subDays(now, 30), to: now };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "custom":
      return { from: subDays(now, 7), to: now };
  }
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handlePresetSelect = (preset: DateRangePreset) => {
    hapticTap();
    const { from, to } = getPresetRange(preset);
    const option = presetOptions.find((o) => o.value === preset);
    onChange({ preset, from, to, label: option?.label ?? "" });
    setOpen(false);
  };

  const handleCustomFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const from = new Date(e.target.value);
    onChange({ ...value, preset: "custom", from, label: "مخصص" });
  };

  const handleCustomTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const to = new Date(e.target.value);
    onChange({ ...value, preset: "custom", to, label: "مخصص" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-slate-300"
          aria-label="اختر نطاق التاريخ"
        >
          <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="font-medium">{value.label}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 dark:bg-slate-800 dark:border-slate-700" align="start">
        <div className="space-y-1">
          {presetOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePresetSelect(option.value)}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                value.preset === option.value
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {value.preset === "custom" && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">من</label>
              <input
                type="date"
                value={format(value.from, "yyyy-MM-dd")}
                onChange={handleCustomFrom}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">إلى</label>
              <input
                type="date"
                value={format(value.to, "yyyy-MM-dd")}
                onChange={handleCustomTo}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-transparent dark:bg-slate-900 text-gray-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function getDefaultDateRange(): DateRange {
  const { from, to } = getPresetRange("today");
  return { preset: "today", from, to, label: "اليوم" };
}
