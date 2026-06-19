"use client";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { AlertTriangle } from "@/public/SVG";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const Index = ({
  trigger,
  id,
  url,
  title,
  description,
  redirect,
  method,
  sendInBody,
  callBack,
}: {
  trigger: React.ReactNode;
  id: number;
  url?: string;
  title: string;
  description: string;
  redirect?: string;
  method?: string;
  sendInBody?: any;
  callBack?: () => void; // function to call after delete
}) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const locale = useLocale();
  const handleDelete = async () => {
    try {
      const formdata = new FormData();
      if (sendInBody) {
        formdata.append("id", id.toString());
      }
      const response = await fetcherClient<{
        success: boolean;
        message: string;
      }>(`${sendInBody ? `/${url}` : `/${url}/${id}`}`, {
        method: method || "DELETE",
        body: formdata,
      });
      showResponseToast(response);
      redirect && router.push(`/${locale}/${redirect}`);
      router.refresh();
    } catch (error: any) {
      showResponseToast(error.info);
    } finally {
      callBack && callBack();
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
          <AlertTriangle className="w-20 text-error" />
          <p className="text-24 text-textMain font-[600]">{title}</p>
          <p className="text-20 text-textMain text-center">{description}</p>
          <DialogClose asChild>
            <Button
              variant={"errorOutline"}
              className="w-full mt-5 "
              onClick={url ? handleDelete : callBack}
            >
              تأكيد الحذف
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant={"error"} className="w-full">
              إلغاء
            </Button>
          </DialogClose>
        </div>
      }
    />
  );
};

export default Index;
