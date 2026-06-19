"use client";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import { AlertTriangle, DeleteAction } from "@/public/SVG";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const Index = ({ id, serviceName }: { id: number; serviceName?: string }) => {
  const { showResponseToast } = useResponseToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async (deleteFor?: "valid" | "invalid" | "current") => {
    try {
      const body: any = {
        type: serviceName || "fontas",
        id: id,
      };

      if (deleteFor === "valid" || deleteFor === "invalid") {
        body.delete_peak_time_for = deleteFor;
      } else if (deleteFor === "current") {
        // Delete only for the current subtype
        const subtype = searchParams.get("subtype");
        if (subtype) {
          body.subtype = subtype;
        }
      }

      const response = await fetcherClient<{
        success: boolean;
        message: string;
      }>("/deletePeakTime", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      });

      showResponseToast(response);
      router.refresh();
      setIsOpen(false);
    } catch (error: any) {
      showResponseToast(error.info);
    }
  };

  // Show simple delete dialog for non-fontas services
  if (serviceName !== "fontas") {
    return (
      <CustomDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="تنبيه هام"
        color={Colors.error}
        className="max-w-[628px]"
        trigger={
          <button>
            <DeleteAction />
          </button>
        }
        content={
          <div className="flex flex-col items-center justify-center gap-5">
            <AlertTriangle className="w-20 text-error" />
            <p className="text-24 text-textMain font-[600]">سيتم حذف وقت الذروة</p>
            <p className="text-20 text-textMain text-center">
              عند تأكيد هذا الإجراء، سيتم حذف وقت الذروة المحدد ولن يمكن استرجاعه لاحقًا.
            </p>
            <DialogClose asChild>
              <Button
                variant={"errorOutline"}
                className="w-full mt-5"
                onClick={() => handleDelete()}
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
  }

  // Show delete options dialog for fontas service
  return (
    <CustomDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="خيارات الحذف"
      color={Colors.error}
      className="max-w-[628px]"
      trigger={
        <button>
          <DeleteAction />
        </button>
      }
      content={
        <div className="flex flex-col items-center justify-center gap-5">
          <AlertTriangle className="w-20 text-error" />
          <p className="text-24 text-textMain font-[600]">اختر نوع الحذف</p>
          <p className="text-20 text-textMain text-center">
            يمكنك حذف وقت الذروة المحدد فقط، أو حذف جميع أوقات الذروة حسب النوع.
          </p>
          <div className="w-full flex flex-col gap-3">
            <DialogClose asChild>
              <Button
                variant={"errorOutline"}
                className="w-full"
                onClick={() => handleDelete("valid")}
              >
                حذف وقت الذروة المحدد من كل المياه الصالحة للشرب
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant={"errorOutline"}
                className="w-full"
                onClick={() => handleDelete("invalid")}
              >
                حذف وقت الذروة المحدد من كل المياه الغير صالحة للشرب
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant={"errorOutline"}
                className="w-full"
                onClick={() => handleDelete("current")}
              >
                حذف وقت الذروة المحدد فقط
              </Button>
            </DialogClose>
          </div>
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
