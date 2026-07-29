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
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[516px] p-6 rounded-16 flex flex-col bg-card dark:border border-border">
        <DialogClose className="absolute top-6 start-6">
          <CloseCircle />
        </DialogClose>
        <DialogHeader>
          <DialogTitle className="text-24 text-foreground font-[600] text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-20 text-muted-foreground text-center" dir="auto">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full flex-col sm:flex-row gap-4 mt-4">
          <DialogClose asChild>
            <Button type="button" variant="destructive" className="grow" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="grow">
              {cancelLabel}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
