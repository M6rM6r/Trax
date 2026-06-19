import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceDropdownItem {
  key: string;
  value: string;
}

interface ServiceDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  items: ServiceDropdownItem[];
  placeholder?: string;
  className?: string;
}

/**
 * Reusable service dropdown component
 *
 * @param value - Currently selected value
 * @param onValueChange - Change handler
 * @param items - Array of dropdown items with key and value
 * @param placeholder - Placeholder text
 * @param className - Optional className for trigger
 */
export const ServiceDropdown = ({
  value,
  onValueChange,
  items,
  placeholder = "اختر النوع",
  className = "w-[349px]",
}: ServiceDropdownProps) => {
  return (
    <Select dir="rtl" onValueChange={onValueChange} value={value}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.key} value={item.key}>
            {item.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
