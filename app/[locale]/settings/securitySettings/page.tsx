import MainLayout from "@/components/shared/MainLayout";
import FullPageHead from "@/components/shared/FullPageHead";
import { Shield } from "lucide-react";

export default function SecuritySettingsPage() {
  return (
    <MainLayout>
      <div className="p-6 min-h-screen">
        <FullPageHead
          head="إعدادات الأمان"
          description="إدارة إعدادات الأمان والتحقق الثنائي"
          Icon={<Shield className="w-7 h-7" />}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">جاري التنفيذ</p>
        </div>
      </div>
    </MainLayout>
  );
}
