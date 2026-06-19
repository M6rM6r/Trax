import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Bell } from "lucide-react";

export default function NotificationSettingsPage() {
  return (
    <MainLayout>
      <div className="p-6 min-h-screen">
        <FullPageHead
          head="إعدادات الإشعارات"
          description="إدارة قوالب الإشعارات وتنبيهات النظام"
          Icon={<Bell className="w-7 h-7" />}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500 dark:text-slate-400">جاري التنفيذ</p>
        </div>
      </div>
    </MainLayout>
  );
}
