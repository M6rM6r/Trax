import { Checkbox } from "@/components/ui/checkbox";

interface FontasCheckboxesProps {
  applyToAll: boolean;
  applyToValid: boolean;
  applyToInvalid: boolean;
  onCheckboxChange: (type: "all" | "valid" | "invalid") => void;
}

/**
 * Fontas service checkboxes component
 * Handles three mutually exclusive checkboxes for bulk updates
 */
export const FontasCheckboxes = ({
  applyToAll,
  applyToValid,
  applyToInvalid,
  onCheckboxChange,
}: FontasCheckboxesProps) => {
  return (
    <div className="flex flex-col gap-3 items-start">
      {/* Apply to All */}
      <div className="flex items-center gap-2 flex-row-reverse">
        <label
          htmlFor="apply-to-all"
          className="text-sm font-medium leading-none cursor-pointer"
        >
          تطبيق التعديل للكل
        </label>
        <Checkbox
          id="apply-to-all"
          checked={applyToAll}
          onCheckedChange={() => onCheckboxChange("all")}
        />
      </div>

      {/* Apply to Valid Water */}
      <div className="flex items-center gap-2 flex-row-reverse">
        <label
          htmlFor="apply-to-valid"
          className="text-sm font-medium leading-none cursor-pointer"
        >
          تطبيق التعديل للمياه الصالحة للشرب
        </label>
        <Checkbox
          id="apply-to-valid"
          checked={applyToValid}
          onCheckedChange={() => onCheckboxChange("valid")}
        />
      </div>

      {/* Apply to Invalid Water */}
      <div className="flex items-center gap-2 flex-row-reverse">
        <label
          htmlFor="apply-to-invalid"
          className="text-sm font-medium leading-none cursor-pointer"
        >
          تطبيق التعديل للمياه الغير صالحة للشرب
        </label>
        <Checkbox
          id="apply-to-invalid"
          checked={applyToInvalid}
          onCheckedChange={() => onCheckboxChange("invalid")}
        />
      </div>
    </div>
  );
};
