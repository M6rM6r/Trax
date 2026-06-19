import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { UnitsRecord } from "@/lib/types/responseTypes";

interface FontasDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  fontasUnits: UnitsRecord[] | undefined;
  dataEnums: any;
}

/**
 * Fontas service dropdown component
 * Shows grouped fontas units (valid/invalid water) with alphabetical sorting
 */
export const FontasDropdown = ({
  value,
  onValueChange,
  fontasUnits,
  dataEnums,
}: FontasDropdownProps) => {
  /**
   * Sort fontas units by type and group by drinkability
   */
  const getSortedFontasUnits = () => {
    if (!fontasUnits) return { validToDrink: [], notValidToDrink: [] };

    // Separate valid and invalid to drink
    const validToDrink = fontasUnits.filter(item => item.type === "صالح للشرب");
    const notValidToDrink = fontasUnits.filter(item => item.type === "غير صالح للشرب");

    // Sort each group alphabetically
    validToDrink.sort((a, b) => a.type.localeCompare(b.type, 'ar'));
    notValidToDrink.sort((a, b) => a.type.localeCompare(b.type, 'ar'));

    return { validToDrink, notValidToDrink };
  };

  const { validToDrink, notValidToDrink } = getSortedFontasUnits();

  // Check if selected unit is inactive
  const selectedUnit = fontasUnits?.find(unit => unit.id.toString() === value);
  const isSelectedUnitInactive = selectedUnit?.is_active === 0;

  return (
    <>
      <Select
        dir="rtl"
        onValueChange={onValueChange}
        value={value}
      >
        <SelectTrigger className="w-[349px]">
          <SelectValue placeholder="اختر النوع" />
        </SelectTrigger>
        <SelectContent>
        {dataEnums && (
          <>
            {/* Valid to drink group */}
            {validToDrink.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-sm font-semibold">
                  صالح للشرب
                </div>
                {validToDrink.map((item: UnitsRecord) => (
                  <SelectItem
                    key={item.id}
                    value={item.id.toString()}
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.type} - {item.value} - {item.unit}</span>
                      {item.is_active === 0 && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white">
                          غير نشط
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {notValidToDrink.length > 0 && <Separator className="my-1" />}
              </>
            )}

            {/* Not valid to drink group */}
            {notValidToDrink.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-sm font-semibold">
                  غير صالح للشرب
                </div>
                {notValidToDrink.map((item: UnitsRecord) => (
                  <SelectItem
                    key={item.id}
                    value={item.id.toString()}
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.type} - {item.value} - {item.unit}</span>
                      {item.is_active === 0 && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white">
                          غير نشط
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </>
        )}
      </SelectContent>
    </Select>

    {/* Show note if selected unit is inactive */}
    {isSelectedUnitInactive && (
      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800" dir="rtl">
          <strong>ملاحظة:</strong> لتفعيل وحدة الفونطاس هذه، من الشريط الجانبي: بيانات المركبات ← وحدات الفونطاس
        </p>
      </div>
    )}
  </>
  );
};
