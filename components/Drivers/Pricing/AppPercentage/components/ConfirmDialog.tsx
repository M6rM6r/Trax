import { ReactNode } from "react";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { Slash } from "@/public/SVG";

interface ConfirmDialogProps {
  open: boolean;
  loading: boolean;
  zoneName?: string;
  scopeLabel: string;
  scopeValue: string;
  additionalInfo?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Generic confirmation dialog for service settings updates
 * Can be used by ALL services (fontas, taxi, wensh, etc.)
 *
 * @param open - Whether dialog is open
 * @param loading - Whether confirmation is in progress
 * @param zoneName - Name of the zone being updated
 * @param scopeLabel - Label for scope field (e.g., "نطاق التطبيق", "نوع المركبة")
 * @param scopeValue - Value of scope (e.g., "تطبيق للكل", "سيارة صغيرة")
 * @param additionalInfo - Optional additional information to display
 * @param onConfirm - Confirm button handler
 * @param onCancel - Cancel button handler
 * @param onOpenChange - Optional dialog open state change handler
 *
 * @example
 * // For fontas with checkbox
 * <ConfirmDialog
 *   open={confirmOpen}
 *   loading={confirmLoading}
 *   zoneName={searchParams.get("zone_name") || "كامل المملكة"}
 *   scopeLabel="نطاق التطبيق"
 *   scopeValue="تطبيق التعديل للكل"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 *
 * @example
 * // For other services (future)
 * <ConfirmDialog
 *   open={confirmOpen}
 *   loading={confirmLoading}
 *   zoneName={searchParams.get("zone_name") || "كامل المملكة"}
 *   scopeLabel="نوع المركبة"
 *   scopeValue="سيارة صغيرة"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 */
export const ConfirmDialog = ({
  open,
  loading,
  zoneName = "كامل المملكة",
  scopeLabel,
  scopeValue,
  additionalInfo,
  onConfirm,
  onCancel,
  onOpenChange,
}: ConfirmDialogProps) => {
  return (
    <CustomDialog
      title="تنبيه هام"
      color={Colors.warning}
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !loading) {
          onCancel();
        }
        if (onOpenChange) {
          onOpenChange(isOpen);
        }
      }}
      trigger={<></>}
      content={
        <div className="flex flex-col items-center justify-center gap-5">
          {/* Warning Icon */}
          <Slash className="w-20 text-accentWarning" />

          {/* Title */}
          <p className="text-24 text-textMain font-[600]">
            سيتم تطبيق هذه التغييرات على:
          </p>

          {/* Details */}
          <div className="flex flex-col gap-2 w-full text-center">
            {/* Zone Info */}
            <p className="text-18 text-textMain">
              <span className="font-[600]">المنطقة: </span>
              {zoneName}
            </p>

            {/* Scope Info */}
            <p className="text-18 text-textMain">
              <span className="font-[600]">{scopeLabel}: </span>
              {scopeValue}
            </p>

            {/* Additional Info (optional) */}
            {additionalInfo && (
              <div className="text-18 text-textMain">
                {additionalInfo}
              </div>
            )}
          </div>

          {/* Action Buttons */}
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
