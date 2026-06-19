"use client";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { AlertTriangle } from "@/public/SVG";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";

const Index = ({
  trigger,
  id,
  teamsIds,
  title,
  description,
  redirect,
}: {
  trigger: React.ReactNode;
  id: number;
  teamsIds: number[];
  url: string;
  title: string;
  description: string;
  redirect?: string;
  method?: string;
  sendInBody?: any;
}) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();

  const handleDelete = async () => {
    try {
      const formdata = new FormData();
      teamsIds.forEach((i) => {
        i === id ? "" : formdata.append("members[]", i.toString());
      });
      formdata.append("_method", "put");
      const response = await fetcherClient<{
        success: boolean;
        message: string;
      }>(`/teams/${params.id}`, {
        method: "POST",
        body: formdata,
      });
      showResponseToast(response);
      redirect && router.push(`/${locale}/${redirect}`);
      router.refresh();
    } catch (error: any) {
      showResponseToast(error.info);
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
              onClick={handleDelete}
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
