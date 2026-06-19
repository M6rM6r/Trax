import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { Slash } from "@/public/SVG";

interface FontasConfirmDialogProps {
  open: boolean;
  loading: boolean;
  applyToAll: boolean;
  applyToValid: boolean;
  applyToInvalid: boolean;
  fontasUnitLabel?: string;
  zoneName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const FontasConfirmDialog = ({
  open,
  loading,
  applyToAll,
  applyToValid,
  applyToInvalid,
  fontasUnitLabel,
  zoneName,
  onConfirm,
  onCancel,
}: FontasConfirmDialogProps) => {
  // Determine the scope text based on checkbox states
  const getScopeText = () => {
    if (applyToAll) return "تطبيق التعديل للكل";
    if (applyToValid) return "تطبيق التعديل للمياه الصالحة للشرب";
    if (applyToInvalid) return "تطبيق التعديل للمياه الغير صالحة للشرب";
    return fontasUnitLabel || "";
  };

  const getScopeLabel = () => {
    if (applyToAll || applyToValid || applyToInvalid) {
      return "نطاق التطبيق: ";
    }
    return "وحدة الفنطاس: ";
  };

  return (
    <CustomDialog
      title="تنبيه هام"
      color={Colors.warning}
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
      trigger={<></>}
      content={
        <div className="flex flex-col items-center justify-center gap-5">
          <Slash className="w-20 text-accentWarning" />
          <p className="text-24 text-textMain font-[600]">
            سيتم تطبيق هذه التغييرات على:
          </p>
          <div className="flex flex-col gap-2 w-full text-center">
            <p className="text-18 text-textMain">
              <span className="font-[600]">المنطقة: </span>
              {zoneName || "كامل المملكة"}
            </p>
            <p className="text-18 text-textMain">
              <span className="font-[600]">{getScopeLabel()}</span>
              {getScopeText()}
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <Button
              variant="primary"
              className="flex-1"
              disabled={loading}
              onClick={onConfirm}
            >
              {loading ? "جاري الحفظ..." : "تأكيد"}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={loading}
              onClick={onCancel}
            >
              إلغاء
            </Button>
          </div>
        </div>
      }
    />
  );
};

export default FontasConfirmDialog;
