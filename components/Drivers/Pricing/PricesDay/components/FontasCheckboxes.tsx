import { Checkbox } from "@/components/ui/checkbox";

interface FontasCheckboxesProps {
  applyToAll: boolean;
  applyToValid: boolean;
  applyToInvalid: boolean;
  onCheckboxChange: (type: "all" | "valid" | "invalid") => void;
}

const FontasCheckboxes = ({
  applyToAll,
  applyToValid,
  applyToInvalid,
  onCheckboxChange,
}: FontasCheckboxesProps) => {
  return (
    <div className="col-span-full flex flex-col gap-3 items-start justify-self-start w-auto">
      <div className="flex items-center gap-2 flex-row-reverse">
        <label
          htmlFor="prices-apply-to-all"
          className="text-sm font-medium leading-none cursor-pointer"
        >
          تطبيق التعديل للكل
        </label>
        <Checkbox
          id="prices-apply-to-all"
          checked={applyToAll}
          onCheckedChange={() => onCheckboxChange("all")}
        />
      </div>
      <div className="flex items-center gap-2 flex-row-reverse">
        <label
          htmlFor="prices-apply-to-valid"
          className="text-sm font-medium leading-none cursor-pointer"
        >
          تطبيق التعديل للمياه الصالحة للشرب
        </label>
        <Checkbox
          id="prices-apply-to-valid"
          checked={applyToValid}
          onCheckedChange={() => onCheckboxChange("valid")}
        />
      </div>
      <div className="flex items-center gap-2 flex-row-reverse">
        <label
          htmlFor="prices-apply-to-invalid"
          className="text-sm font-medium leading-none cursor-pointer"
        >
          تطبيق التعديل للمياه الغير صالحة للشرب
        </label>
        <Checkbox
          id="prices-apply-to-invalid"
          checked={applyToInvalid}
          onCheckedChange={() => onCheckboxChange("invalid")}
        />
      </div>
    </div>
  );
};

export default FontasCheckboxes;
