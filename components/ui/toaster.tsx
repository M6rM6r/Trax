"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { motion } from "framer-motion";

const TOAST_DURATION = 5000;

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <div role="status" aria-live="polite" aria-atomic="false">
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="line-clamp-2">{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: TOAST_DURATION / 1000, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-background/30 rounded-full"
              />
            </Toast>
          );
        })}
      </div>
      <ToastViewport />
    </ToastProvider>
  );
}
