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
  title = "غير مصرح لك بالوصول",
  message,
  ctaLabel = "الذهاب إلى تسجيل الحضور",
  ctaHref,
}: AccessDeniedCardProps) {
  return (
    <Card className="border-0 shadow-lg dark:bg-slate-800 max-w-2xl mx-auto mt-10">
      <CardContent className="p-8 text-center space-y-3">
        <Icon className="w-10 h-10 mx-auto text-gray-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400">{message}</p>
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primaryColor text-white hover:bg-primaryColor/90 transition-colors"
        >
          {ctaLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
