"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ComponentType } from "react";

interface GenericEmptyProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  gradient?: string;
}

export default function GenericEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  gradient = "from-gray-100 to-slate-100 dark:from-slate-700 dark:to-slate-800",
}: GenericEmptyProps) {
  return (
    <Card className="border-0 shadow-lg animate-scale-in" role="region" aria-label={title}>
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6`}
        >
          <Icon className="w-10 h-10 text-gray-400 dark:text-slate-500" />
        </motion.div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-slate-200 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-sm">{description}</p>
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction} className="flex items-center gap-2">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
