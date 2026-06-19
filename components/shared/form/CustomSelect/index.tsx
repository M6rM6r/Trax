"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef } from "react";
import { ErrorMessage, FormikProps } from "formik";
import Select, {
  GroupBase,
  MultiValue,
  OptionsOrGroups,
  SingleValue,
} from "react-select";
import { SelectArrow } from "@/public/SVG";
import AsyncSelect from "react-select/async";

interface Option {
  [key: string]: any;
  label: string;
  value: string | number;
}

interface CustomSelectProps {
  name: string;
  title?: string;
  placeholder?: string;
  isMultiple?: boolean;
  formikProps: FormikProps<any>;
  options: Option[];
  label: string;
  value: string;
  initialValue?: any;
  className?: string;
  callBack?: (selectedValue: any) => Promise<void> | void;
  asyncOptions?: boolean;
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onSearch?: (inputValue: string) => Promise<Option[]> | Option[];
  required?: boolean;
}

const CustomSelect = ({
  name,
  title,
  placeholder = "- اختر -",
  isMultiple = false,
  formikProps,
  options,
  label,
  value,
  initialValue,
  className,
  callBack,
  asyncOptions = false,
  loadMore,
  hasMore = false,
  loading = false,
  onSearch,
  required = false,
}: CustomSelectProps) => {
  const observer = useRef<IntersectionObserver | null>(null);

  // إنشاء عنصر مراقبة للتحميل التلقائي
  const lastOptionElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && loadMore) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  const handleChange = async (selected: any) => {
    if (isMultiple) {
      const selectedValues = selected
        ? selected.map((option: Option) => option[value])
        : [];
      formikProps.setFieldValue(name, selectedValues);
    } else {
      const selectedValue = selected ? selected[value] : null;
      formikProps.setFieldValue(name, selectedValue);
      if (callBack) {
        await callBack(selectedValue);
      }
    }
  };

  // دعم الـ scroll للتحميل باستخدام Intersection Observer
  const handleMenuScroll = useCallback(
    (e: any) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const isNearBottom = scrollHeight - scrollTop <= clientHeight + 50;
      if (isNearBottom && hasMore && !loading && loadMore) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

  // Debounce timer ref for search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // إذا كنت تريد استخدام AsyncSelect للتحميل الديناميكي
  const loadOptions = useCallback(
    (inputValue: string, callback: (options: Option[]) => void) => {
      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the search to avoid too many API calls (200ms delay - reduced for better responsiveness)
      debounceTimerRef.current = setTimeout(() => {
        if (onSearch) {
          const result = onSearch(inputValue);
          if (result instanceof Promise) {
            result.then(callback).catch((error) => {
              console.error("Search error:", error);
              callback([]);
            });
          } else {
            callback(result);
          }
        } else {
          callback(options);
        }
      }, 200);
    },
    [onSearch, options]
  );

  // إضافة عنصر تحميل في نهاية القائمة مع التأكد من توافق النوع
  const formatOptions = useCallback(
    (options: Option[]): OptionsOrGroups<Option, GroupBase<Option>> => {
      if (!asyncOptions) return options;

      const baseOptions = [...options];

      if (hasMore) {
        // إنشاء عنصر تحميل متوافق مع النوع المطلوب
        const loadingOption: Option = {
          [value]: "loading",
          [label]: "loading",
          label: "loading",
          value: "loading",
          isDisabled: true,
        };

        return [...baseOptions, loadingOption];
      }

      return baseOptions;
    },
    [asyncOptions, hasMore, value, label]
  );

  // مكون تحميل مخصص
  const LoadingIndicator = () => (
    <div className="flex flex-col gap-2 w-full p-2">
      <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-10 border border-gray-200 rounded-xl bg-gray-100 animate-pulse"></div>
    </div>
  );

  if (asyncOptions && onSearch) {
    return (
      <div className={`flex flex-col gap-2 relative ${className}`}>
        {title && (
          <p className="text-16 text-primarySlate700 font-[600]">{title}</p>
        )}

        <AsyncSelect
          value={
            isMultiple
              ? options.filter((opt) =>
                  (formikProps.values[name] || []).includes(opt[value])
                )
              : options.find(
                  (opt) => opt[value] === formikProps.values[name]
                ) || null
          }
          onChange={handleChange}
          loadOptions={loadOptions}
          defaultOptions={true}
          placeholder={placeholder}
          isMulti={isMultiple}
          closeMenuOnSelect={!isMultiple}
          menuPlacement="bottom"
          className="w-full"
          getOptionLabel={(option: Option) => option[label]}
          getOptionValue={(option: Option) => option[value]}
          onMenuScrollToBottom={handleMenuScroll}
          noOptionsMessage={() =>
            loading ? <LoadingIndicator /> : "لا توجد خيارات متاحة"
          }
          loadingMessage={() => <LoadingIndicator />}
          cacheOptions={false}
          filterOption={null}
          styles={{
            input: (provided) => ({
              ...provided,
              height: "30px",
              borderRadius: "10px",
              border: "1px solid transparent",
            }),
            option: (provided, state) => ({
              ...provided,
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: state.isSelected ? "#007bff" : "#333",
              backgroundColor: state.isSelected ? "#eaf4ff" : "white",
            }),
            singleValue: (provided) => ({
              ...provided,
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              color: "#333",
            }),
          }}
        />

        <SelectArrow className="absolute top-[45px] left-[9px] z-0" />

        <ErrorMessage
          component={"div"}
          name={name}
          className="text-14 text-red-500"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 relative ${className}`}>
      {title && (
        <p className="text-16 text-primarySlate700 font-[600]">{title}</p>
      )}
      <Select
        value={
          options.find(
            (option) => option[value] === formikProps.values[name]
          ) || null
        }
        onChange={(newValue: SingleValue<Option> | MultiValue<Option>) => {
          if (isMultiple) {
            const selectedValues = (newValue as MultiValue<Option>).map(
              (opt) => opt[value]
            );
            formikProps.setFieldValue(name, selectedValues);
          } else {
            const selected = newValue as SingleValue<Option>;
            const selectedValue = selected ? selected[value] : "";
            formikProps.setFieldValue(name, selectedValue);
            callBack?.(selectedValue);
          }
        }}
        options={formatOptions(options)}
        placeholder={placeholder}
        isMulti={isMultiple}
        closeMenuOnSelect={!isMultiple}
        required={required}
        menuPlacement="bottom"
        className="w-full"
        getOptionLabel={(option: Option) =>
          option[value] === "loading" ? "loading" : option[label]
        }
        getOptionValue={(option: Option) => option[value]}
        onMenuScrollToBottom={asyncOptions ? handleMenuScroll : undefined}
        noOptionsMessage={() =>
          loading ? <LoadingIndicator /> : "لا توجد خيارات متاحة"
        }
        components={{
          Option: (props) => {
            if (props.data[value] === "loading") {
              return (
                <div ref={lastOptionElementRef}>
                  <LoadingIndicator />
                </div>
              );
            }
            return (
              <div
                {...props.innerProps}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                  props.isSelected
                    ? "bg-blue-100 text-blue-800"
                    : "hover:bg-gray-100"
                }`}
              >
                {props.data[label]}
              </div>
            );
          },
        }}
        styles={{
          input: (provided) => ({
            ...provided,
            height: "30px",
            borderRadius: "10px",
            border: "1px solid transparent",
          }),
          singleValue: (provided) => ({
            ...provided,
            display: "flex",
            alignItems: "center",
            fontSize: "16px",
            color: "#333",
          }),
          menu: (provided) => ({
            ...provided,
            zIndex: 9999,
          }),
        }}
      />

      <SelectArrow className="absolute top-[45px] left-[9px] z-0" />

      <ErrorMessage
        component={"div"}
        name={name}
        className="text-14 text-red-500"
      />
    </div>
  );
};

export default CustomSelect;
