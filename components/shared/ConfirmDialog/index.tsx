"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloseCircle } from "@/public/SVG";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  trigger?: ReactNode;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "حذف",
  cancelLabel = "إلغاء",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[516px] p-6 rounded-16 flex flex-col dark:bg-slate-800 dark:border dark:border-slate-700">
        <DialogClose className="absolute top-6 left-6">
          <CloseCircle />
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-24 text-textMain dark:text-slate-100 font-[600] text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-20 text-textSubTextDarker dark:text-slate-400 text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full gap-4 mt-4">
          <DialogClose asChild>
            <Button type="button" variant="error" className="grow" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="errorOutline" className="grow bg-error50 border-none">
              {cancelLabel}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
