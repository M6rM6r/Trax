import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CloseCircle } from "@/public/SVG";
import React from "react";

export enum Colors {
  primary = "primary",
  warning = "warning",
  error = "error",
}

const Index = ({
  trigger,
  content,
  color,
  title,
  className,
  close,
  open, //  دعم الوضع الـ controlled
  onOpenChange, //  دعم الوضع الـ controlled
}: {
  trigger: React.ReactNode;
  content: React.ReactNode;
  color: Colors;
  title: string;
  className?: string;
  close?: React.ReactNode;
  open?: boolean; // ممكن تديره من بره
  onOpenChange?: (open: boolean) => void; // callback للتغير
}) => {
  const colorsVariants = {
    primary:
      " !bg-primaryColorLight text-primaryColor border-b border-primaryColor",
    warning:
      " !bg-accentWarningLight text-accentWarning border-b border-accentWarning",
    error:
      " !bg-accentDangerLight text-accentDanger border-b border-accentDanger",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={`p-0 rounded-md ${className}`}>
        <DialogHeader
          className={cn(
            " flex flex-row justify-between items-center py-5 px-6 rounded-t-md",
            colorsVariants[color]
          )}
        >
          <DialogTitle className="text-24 font-[700] flex items-center justify-between grow">
            <span>{title}</span>
            <DialogClose asChild className="cursor-pointer">
              {close ? (
                close
              ) : (
                <CloseCircle
                  className={`w-8 h-8 ${
                    color === Colors.primary
                      ? "text-primaryColor"
                      : color === Colors.error
                      ? "text-accentDanger"
                      : "text-accentWarning"
                  }`}
                />
              )}
            </DialogClose>
          </DialogTitle>
          <DialogDescription className=" sr-only">
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">{content}</div>
      </DialogContent>
    </Dialog>
  );
};

export default Index;
