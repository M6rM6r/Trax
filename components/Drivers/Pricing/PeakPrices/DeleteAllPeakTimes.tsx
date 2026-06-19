"use client";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { AlertTriangle } from "@/public/SVG";
import { useRouter } from "next/navigation";

const DeleteAllPeakTimes = ({
  trigger,
  deleteFor,
}: {
  trigger: React.ReactNode;
  deleteFor: "valid" | "invalid";
}) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const response = await fetcherClient<{
        success: boolean;
        message: string;
      }>("/deletePeakTime", {
        method: "POST",
        body: JSON.stringify({
          type: "fontas",
          delete_peek_time_for: deleteFor,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      showResponseToast(response);
      router.refresh();
    } catch (error: any) {
      showResponseToast(error.info);
    }
  };

  const title = deleteFor === "valid"
    ? "حذف جميع أوقات الذروة للمياه الصالحة للشرب"
    : "حذف جميع أوقات الذروة للمياه الغير صالحة للشرب";

  const description = deleteFor === "valid"
    ? "عند تأكيد هذا الإجراء، سيتم حذف جميع أوقات الذروة للمياه الصالحة للشرب ولن يمكن استرجاعها لاحقًا."
    : "عند تأكيد هذا الإجراء، سيتم حذف جميع أوقات الذروة للمياه الغير صالحة للشرب ولن يمكن استرجاعها لاحقًا.";

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
              className="w-full mt-5"
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

export default DeleteAllPeakTimes;
