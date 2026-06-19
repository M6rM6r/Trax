"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EyeIcon, EyeOffIcon, ChevronDownIcon, ChevronUpIcon } from "./Icons";

interface ContainerMockupSectionProps {
  pageKey: string;
  containerKey: string;
  containerData: any;
  expandedContainers: Set<string>;
  onToggleContainer: (containerKey: string) => void;
  onContainerToggle: (
    pageKey: string,
    containerKey: string,
    active: boolean
  ) => void;
  onChange: (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    value: any
  ) => void;
  onArrayItemChange: (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    index: number,
    value: string
  ) => void;
  onNestedObjectChange: (
    pageKey: string,
    containerKey: string,
    fieldKey: string,
    index: number,
    nestedKey: string,
    value: string
  ) => void;
}

const fieldLabels: { [key: string]: string } = {
  title: "العنوان الرئيسي",
  subtitle: "العنوان الفرعي",
  description: "الوصف",
  cta: "نص زر الدعوة للإجراء",
  items: "العناصر",
  steps: "الخطوات",
  sections: "الأقسام",
  benefits: "المزايا",
  advantages: "المميزات",
  nameLabel: "تسمية الاسم",
  emailLabel: "تسمية البريد الإلكتروني",
  phoneLabel: "تسمية الهاتف",
  messageLabel: "تسمية الرسالة",
  submitButton: "زر الإرسال",
  placeholder: "النص التوضيحي",
  button: "زر",
};

const ContainerMockupSection = ({
  pageKey,
  containerKey,
  containerData,
  expandedContainers,
  onToggleContainer,
  onContainerToggle,
  onChange,
  onArrayItemChange,
  onNestedObjectChange,
}: ContainerMockupSectionProps) => {
  const getFieldLabel = (fieldKey: string): string => {
    return fieldLabels[fieldKey] || fieldKey;
  };

  const renderField = (fieldKey: string, fieldValue: any) => {
    if (fieldKey === "id" || fieldKey === "active") return null;

    if (Array.isArray(fieldValue)) {
      return (
        <div key={fieldKey} className="md:col-span-2">
          <label className="block text-right font-medium text-gray-700 mb-2">
            {getFieldLabel(fieldKey)} ({fieldValue.length} عنصر)
          </label>
          <div className="space-y-3">
            {fieldValue.map((item: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="whitespace-nowrap">
                    العنصر {index + 1}
                  </Badge>
                </div>
                {typeof item === "string" ? (
                  <Input
                    dir="rtl"
                    value={item}
                    onChange={(e) =>
                      onArrayItemChange(
                        pageKey,
                        containerKey,
                        fieldKey,
                        index,
                        e.target.value
                      )
                    }
                    placeholder={`نص العنصر ${index + 1}`}
                  />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(item).map(
                      ([nestedKey, nestedValue]: [string, any]) => (
                        <div key={nestedKey} className="space-y-2">
                          <label className="block text-right text-sm font-medium text-gray-600">
                            {getFieldLabel(nestedKey)}
                          </label>
                          {typeof nestedValue === "string" &&
                          nestedValue.length > 100 ? (
                            <Textarea
                              dir="rtl"
                              value={nestedValue}
                              onChange={(e) =>
                                onNestedObjectChange(
                                  pageKey,
                                  containerKey,
                                  fieldKey,
                                  index,
                                  nestedKey,
                                  e.target.value
                                )
                              }
                              rows={3}
                              placeholder={`أدخل ${getFieldLabel(nestedKey)}`}
                            />
                          ) : (
                            <Input
                              dir="rtl"
                              value={nestedValue}
                              onChange={(e) =>
                                onNestedObjectChange(
                                  pageKey,
                                  containerKey,
                                  fieldKey,
                                  index,
                                  nestedKey,
                                  e.target.value
                                )
                              }
                              placeholder={`أدخل ${getFieldLabel(nestedKey)}`}
                            />
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    } else if (typeof fieldValue === "object" && fieldValue !== null) {
      return (
        <div key={fieldKey} className="md:col-span-2">
          <label className="block text-right font-medium text-gray-700 mb-2">
            {getFieldLabel(fieldKey)}
          </label>
          <div className="space-y-4 border p-4 rounded-lg bg-white">
            {Object.entries(fieldValue).map(
              ([nestedKey, nestedValue]: [string, any]) => (
                <div key={nestedKey} className="space-y-2">
                  <label className="block text-right text-sm font-medium text-gray-600">
                    {getFieldLabel(nestedKey)}
                  </label>
                  {typeof nestedValue === "string" &&
                  nestedValue.length > 100 ? (
                    <Textarea
                      dir="rtl"
                      value={nestedValue}
                      onChange={(e) =>
                        onChange(
                          pageKey,
                          containerKey,
                          `${fieldKey}.${nestedKey}`,
                          e.target.value
                        )
                      }
                      rows={3}
                      placeholder={`أدخل ${getFieldLabel(nestedKey)}`}
                    />
                  ) : (
                    <Input
                      dir="rtl"
                      value={nestedValue}
                      onChange={(e) =>
                        onChange(
                          pageKey,
                          containerKey,
                          `${fieldKey}.${nestedKey}`,
                          e.target.value
                        )
                      }
                      placeholder={`أدخل ${getFieldLabel(nestedKey)}`}
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div key={fieldKey} className="flex flex-col space-y-2">
          <label className="text-right font-medium text-gray-700">
            {getFieldLabel(fieldKey)}
          </label>
          {typeof fieldValue === "string" && fieldValue.length > 100 ? (
            <Textarea
              dir="rtl"
              value={fieldValue}
              onChange={(e) =>
                onChange(pageKey, containerKey, fieldKey, e.target.value)
              }
              rows={4}
              placeholder={`أدخل ${getFieldLabel(fieldKey)}`}
            />
          ) : (
            <Input
              dir="rtl"
              value={fieldValue}
              onChange={(e) =>
                onChange(pageKey, containerKey, fieldKey, e.target.value)
              }
              placeholder={`أدخل ${getFieldLabel(fieldKey)}`}
            />
          )}
        </div>
      );
    }
  };

  const containerFullKey = `${pageKey}-${containerKey}`;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleContainer(containerFullKey)}
            className="hover:bg-gray-100"
          >
            {expandedContainers.has(containerFullKey) ? (
              <ChevronUpIcon />
            ) : (
              <ChevronDownIcon />
            )}
          </Button>
          <h3 className="font-semibold text-gray-800 text-lg capitalize">
            {containerKey.replace(/([A-Z])/g, " $1").trim()}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {containerData.active ? <EyeIcon /> : <EyeOffIcon />}
            <span
              className={`text-sm ${
                containerData.active
                  ? "text-green-600 font-medium"
                  : "text-gray-500"
              }`}
            >
              {containerData.active ? "نشط" : "غير نشط"}
            </span>
          </div>
          <Switch
            checked={containerData.active}
            onCheckedChange={(checked) =>
              onContainerToggle(pageKey, containerKey, checked)
            }
          />
        </div>
      </div>

      {expandedContainers.has(containerFullKey) && containerData.active && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg border">
          {Object.entries(containerData.mockups || {}).map(
            ([fieldKey, fieldValue]: [string, any]) =>
              renderField(fieldKey, fieldValue)
          )}
        </div>
      )}
    </div>
  );
};

export default ContainerMockupSection;
