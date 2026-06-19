"use client";
import { Slash } from "@/public/SVG";
import CustomDialog, { Colors } from "../CustomDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { FetcherError } from "@/lib/fetcherTypes";
import { Form, Formik } from "formik";
import CustomInput from "../form/CustomInput";
import * as Yup from "yup";
import { useState } from "react";
import { revalidateDrivers } from "@/app/actions/revalidate";

const validationSchema = Yup.object({
  reason: Yup.string().required("السبب مطلوب"),
});

const Index = ({
  trigger,
  id,
  is_active,
}: {
  trigger: React.ReactNode;
  id: number;
  is_active: boolean;
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // نتحكم في فتح/قفل الديالوج
  const [loading, setLoading] = useState(false);

  const ToggleStatus = async (id: number, reason: string) => {
    try {
      setLoading(true);
      const url = pathname.includes("/drivers")
        ? `/drivers/${id}/toggleActivity`
        : pathname.includes("/customers")
        ? `/customers/${id}/toggleActivity`
        : "";
      const formData = new FormData();
      formData.append("reason", reason);
      formData.append("_method", "put");
      const data = await fetcherClient<{ success: boolean; message: string }>(
        url,
        { method: "POST", body: formData }
      );
      toast({
        description: data.message,
        variant: "default",
      });

      // Revalidate driver pages if on drivers route
      if (pathname.includes("/drivers")) {
        await revalidateDrivers();
      }

      router.refresh();
      setOpen(false); // هنا نقفل الديالوج بعد ما يرجع الريسبونس
    } catch (error: unknown) {
      const errorMessage = (error as FetcherError)?.info?.message || "Error";
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomDialog
      title="تنبيه هام"
      color={Colors.warning}
      className="max-w-[628px]"
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      content={
        <div className="flex flex-col items-center justify-center gap-5 relative z-[100]">
          <Slash className="w-20 text-accentWarning" />
          <p className="text-24 text-textMain font-[600]">
            {is_active
              ? "هل أنت متأكد من حظر المستخدم؟"
              : "هل أنت متأكد من رفع الحظر عن المستخدم؟"}
          </p>
          <p className="text-20 text-textMain text-center">
            {is_active
              ? "أنت على وشك حظر هذا المستخدم من الوصول إلى النظام. لن يتمكن المستخدم من تسجيل الدخول أو استخدام أي من الخدمات."
              : "أنت على وشك رفع الحظر عن هذا المستخدم، مما سيمكنه من الوصول إلى النظام واستخدام الخدمات مرة أخرى."}
          </p>
          <Formik
            initialValues={{ reason: "" }}
            onSubmit={(values) => {
              ToggleStatus(id, values.reason);
            }}
            validationSchema={validationSchema}
          >
            {() => (
              <Form className="w-full">
                <CustomInput
                  type="text"
                  name="reason"
                  placeholder=""
                  label={
                    is_active
                      ? "من فضلك ادخل سبب الحظر"
                      : "من فضلك ادخل سبب رفع الحظر"
                  }
                  as="textarea"
                  className="h-40 min-h-28 rounded-6 p-5"
                />

                <Button
                  variant={"warningOutline"}
                  className="w-full mt-5"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "جاري التنفيذ..."
                    : is_active
                    ? "تأكيد الحظر"
                    : "تأكيد رفع الحظر"}
                </Button>

                <Button
                  variant={"warning"}
                  className="w-full mt-5"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  إلغاء
                </Button>
              </Form>
            )}
          </Formik>
        </div>
      }
    />
  );
};

export default Index;
