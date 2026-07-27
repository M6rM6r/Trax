"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ComponentType } from "react";

interface GenericEmptyProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function GenericEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: GenericEmptyProps) {
  return (
    <Card className="border-0 shadow-sm animate-scale-in" role="region" aria-label={title}>
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-muted-foreground/70" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction} className="flex items-center gap-2">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
