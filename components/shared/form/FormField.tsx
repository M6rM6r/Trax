"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  dir?: "ltr" | "rtl";
  lang?: string;
  ltr?: boolean;
  step?: string;
  min?: number;
  maxLength?: number;
  autoComplete?: string;
  className?: string;
}

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
  dir,
  lang,
  ltr = false,
  step,
  min,
  maxLength,
  autoComplete,
  className = "",
}: FormFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">
        {label}
        {required && <span className="text-destructive mr-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        dir={ltr ? "ltr" : dir}
        lang={ltr ? "en" : lang}
        style={ltr ? { unicodeBidi: "plaintext" } : undefined}
        step={step}
        min={min}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={`w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground ${ltr ? "text-left" : "text-right"} ${className}`}
      />
    </div>
  );
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormSelect({
  label,
  value,
  onChange,
  disabled = false,
  className = "",
  children,
}: FormSelectProps) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground mb-1 block">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-input rounded-lg outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground ${className}`}
      >
        {children}
      </select>
    </div>
  );
}
