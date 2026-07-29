import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { LucideIcon } from "lucide-react";

interface AccessDeniedCardProps {
  icon: LucideIcon;
  title?: string;
  message: string;
  ctaLabel?: string;
  ctaHref: string;
}

export default function AccessDeniedCard({
  icon: Icon,
  title = "Access Denied",
  message,
  ctaLabel = "Go to Check In",
  ctaHref,
}: AccessDeniedCardProps) {
  return (
    <Card className="border-0 shadow-lg bg-card max-w-2xl mx-auto mt-10">
      <CardContent className="p-8 text-center space-y-3">
        <Icon className="w-10 h-10 mx-auto text-muted-foreground/70" />
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
