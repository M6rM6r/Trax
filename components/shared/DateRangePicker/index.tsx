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
          className="flex items-center gap-2 text-sm bg-muted bg-card px-3 py-2 rounded-xl border border-border shadow-sm hover:bg-muted hover:bg-muted transition-colors text-muted-foreground"
          aria-label="اختر نطاق التاريخ"
        >
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span className="font-medium">{value.label}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-card border-border" align="start">
        <div className="space-y-1">
          {presetOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePresetSelect(option.value)}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                value.preset === option.value
                  ? "bg-primary/10 text-primary bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted hover:bg-muted text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {value.preset === "custom" && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">من</label>
              <input
                type="date"
                value={format(value.from, "yyyy-MM-dd")}
                onChange={handleCustomFrom}
                className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-transparent bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">إلى</label>
              <input
                type="date"
                value={format(value.to, "yyyy-MM-dd")}
                onChange={handleCustomTo}
                className="w-full px-2 py-1.5 text-sm border border-input rounded-lg bg-transparent bg-background text-foreground"
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
