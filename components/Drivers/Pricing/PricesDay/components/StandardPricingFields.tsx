import CustomInput from "@/components/shared/form/CustomInput";
import { Button } from "@/components/ui/button";

interface StandardPricingFieldsProps {
  includeFields: string[];
  submitButton?: boolean;
}

const StandardPricingFields = ({
  includeFields,
  submitButton = true,
}: StandardPricingFieldsProps) => {
  const fieldConfig: Record<string, { label: string; step: string }> = {
    price_per_km: { label: "سعر الكيلو", step: "0.1" },
    price_per_minute: { label: "سعر الدقيقة", step: "0.1" },
    base_price: { label: "سعر ثابت", step: "0.1" },
    minimum_charge: { label: "سعر الحد الادنى", step: "0.1" },
    waiting_cost: { label: "سعر الانتظار", step: "0.1" },
    cancellation_cost: { label: "سعر الالغاء", step: "0.1" },
    cancellation_time: { label: "وقت الالغاء (بالدقائق)", step: "1" },
    free_km: { label: "الكيلوات المجانية", step: "0.1" },
  };

  return (
    <>
      {includeFields.map((fieldName) => {
        const config = fieldConfig[fieldName];
        if (!config) return null;

        return (
          <CustomInput
            key={fieldName}
            type="number"
            name={fieldName}
            label={config.label}
            placeholder="0"
            step={config.step}
          />
        );
      })}
      {submitButton && (
        <Button
          type="submit"
          variant="primary"
          className="col-span-full max-w-[160px]"
        >
          حفظ
        </Button>
      )}
    </>
  );
};

export default StandardPricingFields;
