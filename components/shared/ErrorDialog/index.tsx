/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { AlertTriangle } from "@/public/SVG";
import CustomDialog, { Colors } from "../CustomDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { fetcherClient } from "@/lib/fetcherClient";
import { useToast } from "@/hooks/use-toast";
import { FetcherError } from "@/lib/fetcherTypes";
import { usePathname, useRouter } from "next/navigation";
import { Form, Formik } from "formik";
import CustomInput from "../form/CustomInput";
import * as Yup from "yup";
import { useRef } from "react";
import { revalidateDrivers } from "@/app/actions/revalidate";

const validationSchema = Yup.object({
  reason: Yup.string().required("السبب مطلوب"),
});
const Index = ({ trigger, id }: { trigger: React.ReactNode; id: number }) => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const handleDelete = async (id: number, reason: string) => {
    try {
      const url = pathname.includes("/drivers")
        ? `/drivers/${id}`
        : pathname.includes("/customers")
        ? `/customers/${id}`
        : "";
      const formData = new FormData();
      formData.append("reason", reason);
      formData.append("_method", "delete");
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

      closeRef.current?.click();

      // If on a profile page, redirect to the list page after deletion
      const isProfilePage = pathname.includes("/profile");
      if (isProfilePage) {
        // Extract the base path (e.g., /ar/drivers or /ar/customers)
        const pathParts = pathname.split("/");
        const locale = pathParts[1];

        if (pathname.includes("/drivers")) {
          router.push(`/${locale}/drivers`);
        } else if (pathname.includes("/customers")) {
          router.push(`/${locale}/customers`);
        }
      } else {
        router.refresh();
      }
    } catch (error: unknown) {
      const errorMessage = (error as FetcherError)?.info?.message || "Error";
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <CustomDialog
      title="تنبيه هام"
      color={Colors.error}
      className="max-w-[628px]"
      trigger={trigger}
      content={
        <div className="flex flex-col items-center justify-center gap-5">
          <DialogClose className="absolute top-5 right-5 z-[-1]" ref={closeRef}>
            close
          </DialogClose>
          <AlertTriangle className="w-20 text-error" />
          <p className="text-24 text-textMain font-[600]">
            هل أنت متأكد من حذف المستخدم؟
          </p>
          <p className="text-20 text-textMain text-center">
            أنت على وشك حذف هذا المستخدم من النظام. هذا الإجراء لا يمكن التراجع
            عنه، وستفقد جميع البيانات المرتبطة بهذا المستخدم بشكل دائم.
          </p>
          <Formik
            initialValues={{ reason: "" }}
            onSubmit={(values) => {
              handleDelete(id, values.reason);
            }}
            validationSchema={validationSchema}
          >
            {() => (
              <Form className="w-full">
                <CustomInput
                  type="text"
                  name="reason"
                  placeholder=""
                  label={"من فضلك ادخل سبب الحذف"}
                  as="textarea"
                  className="h-40 min-h-28 rounded-6 p-5"
                />
                {/* <DialogClose asChild> */}
                <Button
                  variant={"errorOutline"}
                  className="w-full mt-5 "
                  // onClick={() => handleDelete(id)}
                  type="submit"
                >
                  تأكيد الحذف
                </Button>
                {/* </DialogClose> */}
                <DialogClose asChild>
                  <Button variant={"error"} className="w-full mt-5">
                    إلغاء
                  </Button>
                </DialogClose>
              </Form>
            )}
          </Formik>
        </div>
      }
    />
  );
};

export default Index;
