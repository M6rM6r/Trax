"use client";

import { Button } from "@/components/ui/button";

interface SaveChangesDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const SaveChangesDialog = ({ onConfirm, onCancel }: SaveChangesDialogProps) => {
  return (
    <div className="space-y-4">
      <p className="text-right text-gray-700 text-lg">
        هل أنت متأكد من أنك تريد حفظ جميع التغييرات؟ سيتم تحديث المحتوى في
        الموقع مباشرة.
      </p>
      <div className="flex gap-3 justify-end pt-4">
        <Button variant="outline" onClick={onCancel} className="px-6">
          إلغاء
        </Button>
        <Button variant={"primary"} onClick={onConfirm} className="px-6">
          تأكيد الحفظ
        </Button>
      </div>
    </div>
  );
};

export default SaveChangesDialog;
