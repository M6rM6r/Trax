import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog"; // adjust import if needed
import React from "react";
import { allEnumsData } from "@/lib/types/enums";

interface ConfirmDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  loading: boolean;
  confirmUpdate: () => void;
  selectedStatus: string;
  newStatus: string;
}

export default function ConfirmStatusDialog({
  open,
  setOpen,
  loading,
  confirmUpdate,
  selectedStatus,
  newStatus,
}: ConfirmDialogProps) {
  const content = (
    <div className="text-center space-y-6">
      <p className="text-lg text-gray-700 leading-8">
        هل أنت متأكد أنك تريد تحديث حالة وصل من{" "}
        <span className="font-semibold text-gray-900">
          {
            allEnumsData.DriverStatus.ar[
              selectedStatus as keyof typeof allEnumsData.DriverStatus.ar
            ]
          }
        </span>{" "}
        إلى{" "}
        <span className="font-semibold text-primary">
          {
            allEnumsData.DriverStatus.ar[
              newStatus as keyof typeof allEnumsData.DriverStatus.ar
            ]
          }
        </span>
        ؟
      </p>

      <div className="grid grid-cols-2 gap-2 justify-center mt-8">
        <Button
          variant="secondary"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="py-3 text-base font-medium"
        >
          إلغاء
        </Button>
        <Button
          variant="primary"
          onClick={confirmUpdate}
          disabled={loading}
          className="py-3 text-base font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري التحديث...
            </>
          ) : (
            "تأكيد"
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <CustomDialog
      title="تأكيد التحديث"
      color={Colors.primary}
      content={content}
      open={open}
      onOpenChange={setOpen}
      className="sm:max-w-[420px] rounded-2xl"
      trigger={<></>} // no trigger since you’re controlling it externally
    />
  );
}
