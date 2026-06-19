"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { fetcherClient } from "@/lib/fetcherClient";
import { EditAction } from "@/public/SVG";
import { NotificationRecord } from "@/lib/types/responseTypes";
import { Formik, Form } from "formik";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";

// 🔹 Enum maps
const NotificationTemplatesChannels = {
  ar: {
    sms: "SMS",
    notification: "Notification",
    email: "Email",
    whatsapp: "Whatsapp",
  },
};

const NotificationTemplatesTypes = {
  ar: {
    welcome: "رسالة ترحيب",
    fuel: "رسالة خدمة الوقود",
    tires: "رسالة خدمة الاطارات",
    towing: "رسالة خدمة السحب",
    active_fuel: "رسالة قبول خدمة الوقود",
    rejected_fuel: "رسالة رفض خدمة الوقود",
    active_tires: "رسالة قبول خدمة الإطارات",
    rejected_tires: "رسالة رفض خدمة الإطارات",
    active_towing: "رسالة قبول خدمة السحب",
    rejected_towing: "رسالة رفض خدمة السحب",
    driver_without_car: "رسالة خدمة السائق بدون سيارة",
    important_dates: "رسالة خدمة المواعيد المهمة",
    light_transportation: "رسالة خدمة النقل الخفيف",
    fontas: "رسالة خدمة فونطاس",
    wensh: "رسالة خدمة وينش",
    taxi: "رسالة خدمة التاكسي",
  },
};

interface EditNotificationDialogProps {
  notification: NotificationRecord;
  onUpdated?: () => void;
}

export const EditNotificationDialog = ({
  notification,
  onUpdated,
}: EditNotificationDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: Partial<NotificationRecord>) => {
    try {
      setLoading(true);

      await fetcherClient(`/notification-templates/${notification.id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      toast({
        title: "تم تحديث الإشعار بنجاح",
        description: "تم حفظ التعديلات بنجاح.",
      });

      onUpdated?.();
    } catch (error: any) {
      toast({
        title: "حدث خطأ",
        description: "تعذر تحديث الإشعار، حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const DialogContent = (
    <Formik
      initialValues={{
        title_ar: notification.title_ar || "",
        title_en: notification.title_en || "",
        description_ar: notification.description_ar || "",
        description_en: notification.description_en || "",
        type: notification.type || "",
        channel: notification.channel || "",
        isActive: notification.isActive || false,
      }}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, handleSubmit, setFieldValue }) => (
        <Form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title (AR) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                عنوان الإشعار (عربي) *
              </Label>
              <Input
                name="title_ar"
                value={values.title_ar}
                onChange={handleChange}
                placeholder="أدخل عنوان الإشعار بالعربية"
                className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>

            {/* Title (EN) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                عنوان الإشعار (إنجليزي) *
              </Label>
              <Input
                name="title_en"
                value={values.title_en}
                onChange={handleChange}
                placeholder="Enter notification title in English"
                className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description (AR) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                نص الرسالة (عربي) *
              </Label>
              <Textarea
                name="description_ar"
                value={values.description_ar}
                onChange={handleChange}
                placeholder="أدخل نص الرسالة بالعربية"
                rows={4}
                className="resize-y min-h-[100px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>

            {/* Description (EN) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                نص الرسالة (إنجليزي) *
              </Label>
              <Textarea
                name="description_en"
                value={values.description_en}
                onChange={handleChange}
                placeholder="Enter message text in English"
                rows={4}
                className="resize-y min-h-[100px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Settings Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                نوع الإشعار *
              </Label>
              <Select
                value={values.type}
                onValueChange={(val) => setFieldValue("type", val)}
              >
                <SelectTrigger className="w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200">
                  <SelectValue placeholder="اختر نوع الإشعار" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NotificationTemplatesTypes.ar).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Channel Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                قناة الإشعار *
              </Label>
              <Select
                value={values.channel}
                onValueChange={(val) => setFieldValue("channel", val)}
              >
                <SelectTrigger className="w-full focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200">
                  <SelectValue placeholder="اختر قناة الإشعار" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NotificationTemplatesChannels.ar).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-800">
                حالة الإشعار
              </Label>
              <p className="text-xs text-gray-600">
                {values.isActive
                  ? "الإشعار مفعل ومتاح للإرسال"
                  : "الإشعار غير مفعل ومخفي"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  values.isActive ? "text-blue-700" : "text-gray-500"
                }`}
              >
                {values.isActive ? "مفعل" : "غير مفعل"}
              </span>
              <Switch
                checked={values.isActive}
                onCheckedChange={(checked) =>
                  setFieldValue("isActive", checked)
                }
                className="data-[state=checked]:bg-blue-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                /* Dialog close handled by CustomDialog */
              }}
              className="px-6 py-2 font-medium"
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-white font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </div>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );

  return (
    <CustomDialog
      trigger={
        <button className="hover:opacity-70 transition-opacity duration-200">
          <EditAction />
        </button>
      }
      content={DialogContent}
      color={Colors.primary}
      title="تعديل الإشعار"
    />
  );
};
