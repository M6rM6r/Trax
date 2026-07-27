"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { hapticTap } from "@/lib/utils/haptics";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  side?: "left" | "right" | "top" | "bottom";
  children: React.ReactNode;
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  submitLabel = "حفظ",
  cancelLabel = "إلغاء",
  isSubmitting = false,
  side = "right",
  children,
}: FormDrawerProps) {
  const handleSubmit = () => {
    hapticTap();
    onSubmit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold text-foreground">
            {title}
          </SheetTitle>
          {description && (
            <SheetDescription className="text-muted-foreground">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">{children}</div>

        {onSubmit && (
          <SheetFooter className="mt-6 flex-row gap-3 sm:gap-3">
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                submitLabel
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground border-border"
            >
              {cancelLabel}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
