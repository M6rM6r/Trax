"use client";

import { Button } from "@/components/ui/button";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";

interface CancelChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const CancelChangesDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: CancelChangesDialogProps) => {
  const dialogContent = (
    <div className="space-y-4">
      <p className="text-right text-gray-700 text-lg">
        لديك تغييرات غير محفوظة. هل أنت متأكد من أنك تريد إلغاء جميع التغييرات؟
      </p>
      <div className="flex gap-3 justify-end pt-4">
        <Button variant="outline" onClick={onCancel} className="px-6">
          البقاء
        </Button>
        <Button
          onClick={onConfirm}
          className="px-6 bg-accentWarning hover:bg-accentWarning/90"
        >
          نعم، إلغاء التغييرات
        </Button>
      </div>
    </div>
  );

  return (
    <CustomDialog
      trigger={null}
      content={dialogContent}
      color={Colors.warning}
      title="تأكيد إلغاء التغييرات"
      open={open}
      onOpenChange={onOpenChange}
    />
  );
};

export default CancelChangesDialog;
