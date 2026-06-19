"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============ Type Definitions ============
interface PhoneInputProps {
  onPhoneChange?: (data: { country_code: string; mobile: string }) => void;
  initialCountryCode?: string;
}

interface CountryConfig {
  maxLength: number;
  placeholder: string;
  format: (digits: string) => string;
}

// ============ Country Configurations ============
const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  "+966": {
    maxLength: 10, // السعودية - 9 أرقام
    placeholder: "507 777 7777",
    format: (digits) => {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(
        6,
        9
      )}`;
    },
  },
  "+20": {
    maxLength: 11, // مصر - 10 أرقام
    placeholder: "101 234 5678",
    format: (digits) => {
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 10)
        return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(
        6,
        10
      )}`;
    },
  },
  "+971": {
    maxLength: 10, // الإمارات - 9 أرقام
    placeholder: "501 234 567",
    format: (digits) => {
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 9)
        return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(
        5,
        9
      )}`;
    },
  },
  "+1": {
    maxLength: 11, // الولايات المتحدة - 10 أرقام
    placeholder: "555 123 4567",
    format: (digits) => {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 10)
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(
        6,
        10
      )}`;
    },
  },
};

const DEFAULT_COUNTRY = "+966";

// ============ Helper Functions ============
const getCountryConfig = (countryCode: string): CountryConfig => {
  return COUNTRY_CONFIGS[countryCode] || COUNTRY_CONFIGS[DEFAULT_COUNTRY];
};

const getMaxLength = (countryCode: string): number => {
  return getCountryConfig(countryCode).maxLength;
};

const getPlaceholder = (countryCode: string): string => {
  return getCountryConfig(countryCode).placeholder;
};

const formatPhoneNumber = (countryCode: string, digits: string): string => {
  const config = getCountryConfig(countryCode);
  return config.format(digits);
};

const cleanPhoneInput = (value: string, countryCode: string): string => {
  // إزالة كل شيء ما عدا الأرقام
  const digitsOnly = value.replace(/[^\d]/g, "");

  // التحقق من الحد الأقصى
  const maxLength = getMaxLength(countryCode);
  return digitsOnly.slice(0, maxLength);
};

// ============ Component ============
const PhoneInput = ({
  onPhoneChange,
  initialCountryCode = DEFAULT_COUNTRY,
}: PhoneInputProps) => {
  // State Management
  const [countryCode, setCountryCode] = React.useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = React.useState("");

  // Derived State
  const displayValue = React.useMemo(() => {
    if (!phoneNumber) return countryCode;
    const formatted = formatPhoneNumber(countryCode, phoneNumber);
    return `${countryCode} ${formatted}`;
  }, [countryCode, phoneNumber]);

  const currentPlaceholder = React.useMemo(
    () => getPlaceholder(countryCode),
    [countryCode]
  );

  const maxInputLength = React.useMemo(
    () => countryCode.length + getMaxLength(countryCode) + 2, // +2 للفراغات
    [countryCode]
  );

  // Effects
  React.useEffect(() => {
    if (onPhoneChange) {
      onPhoneChange({
        country_code: countryCode,
        mobile: phoneNumber,
      });
    }
  }, [countryCode, phoneNumber, onPhoneChange]);

  // Event Handlers
  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    setPhoneNumber(""); // Reset phone number when country changes
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // إذا كانت القيمة أقل من طول رمز الدولة، لا نفعل شيء
    if (inputValue.length < countryCode.length) {
      return;
    }

    // إزالة رمز الدولة والفراغات، ثم الاحتفاظ بالأرقام فقط
    const afterCountryCode = inputValue
      .slice(countryCode.length)
      .replace(/\s/g, "");
    const digitsOnly = afterCountryCode.replace(/[^\d]/g, "");

    // التحقق من الحد الأقصى
    const maxLength = getMaxLength(countryCode);
    const finalValue = digitsOnly.slice(0, maxLength);

    setPhoneNumber(finalValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart;

    // منع حذف رمز الدولة
    if (
      cursorPosition &&
      cursorPosition <= countryCode.length &&
      (e.key === "Backspace" || e.key === "Delete")
    ) {
      e.preventDefault();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const cursorPosition = input.selectionStart;

    // نقل المؤشر بعد رمز الدولة إذا كان قبله
    if (cursorPosition && cursorPosition <= countryCode.length) {
      setTimeout(() => {
        input.setSelectionRange(countryCode.length + 1, countryCode.length + 1);
      }, 0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // نقل المؤشر لنهاية رمز الدولة عند التركيز
    setTimeout(() => {
      e.target.setSelectionRange(
        countryCode.length + 1,
        countryCode.length + 1
      );
    }, 0);
  };

  // Render
  return (
    <div className="space-y-2 w-full">
      <label className="block text-right text-sm font-medium text-gray-600">
        رقم الجوال
      </label>

      <div
        className={cn(
          "flex items-center justify-between border rounded-lg py-1.5",
          "focus-within:ring-1 focus-within:ring-primaryColor transition"
        )}
      >
        {/* Country Selector */}
        <div className="flex items-center gap-2 border-l pl-2">
          <Select
            defaultValue="+966"
            value={countryCode}
            onValueChange={handleCountryChange}
            disabled={true}
          >
            <SelectTrigger className="border-0 shadow-none focus:ring-0 focus:ring-offset-0 w-auto text-gray-500">
              <SelectValue placeholder="SAR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+966">🇸🇦 (SAR)</SelectItem>
              <SelectItem value="+20">🇪🇬 (EGP)</SelectItem>
              <SelectItem value="+971">🇦🇪 (AED)</SelectItem>
              <SelectItem value="+1">🇺🇸 (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Phone Input */}
        <Input
          type="tel"
          dir="ltr"
          placeholder={`${countryCode} ${currentPlaceholder}`}
          value={displayValue}
          onChange={handlePhoneChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onFocus={handleFocus}
          maxLength={maxInputLength}
          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 text-lg"
        />
      </div>
    </div>
  );
};

export default PhoneInput;
