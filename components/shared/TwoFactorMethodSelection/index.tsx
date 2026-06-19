"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TwoFactorMethodSelectionProps {
  selectedMethod: "sms" | "authenticator" | null;
  onMethodChange: (method: "sms" | "authenticator") => void;
  onContinue: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TwoFactorMethodSelection: React.FC<TwoFactorMethodSelectionProps> = ({
  selectedMethod,
  onMethodChange,
  onContinue,
  onCancel,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col gap-5 w-full">
      <h1 className="text-24 font-[700] bg-clip-text text-transparent bg-primaryColor">
        اختر طريقة التحقق
      </h1>
      <p className="text-18 text-textSubText mb-5 -mt-4">
        يمكنك المتابعة باستخدام أي من وسائل التحقق التي فعلتها مسبقًا، سواء
        عبر الرسائل النصية أو تطبيق المصادقة، لإتمام الدخول بأمان.
      </p>

      <RadioGroup
        value={selectedMethod || undefined}
        onValueChange={(value) =>
          onMethodChange(value as "sms" | "authenticator")
        }
        className="flex flex-col gap-4"
      >
        {/* SMS Option */}
        <label
          htmlFor="sms"
          className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primaryColor/50 transition-colors cursor-pointer"
          onClick={() => onMethodChange("sms")}
        >
          <RadioGroupItem value="sms" id="sms" />
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <div className="text-16 font-[600] text-textMain cursor-pointer">
                SMS Verification
              </div>
              <p className="text-14 text-textSubText mt-1">
                استقبل رمز تحقق عبر رسالة نصية إلى رقمك المسجل.
              </p>
            </div>
            <div className="p-4 rounded-10 bg-primaryColorLight">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 6L12 13L2 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </label>

        {/* Authenticator App Option */}
        <label
          htmlFor="authenticator"
          className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primaryColor/50 transition-colors cursor-pointer"
          onClick={() => onMethodChange("authenticator")}
        >
          <RadioGroupItem value="authenticator" id="authenticator" />
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <div className="text-16 font-[600] text-textMain cursor-pointer">
                Authenticator App
              </div>
              <p className="text-14 text-textSubText mt-1">
                استخدم تطبيق Google Authenticator لتوليد رموز تحقق آمنة.
              </p>
            </div>
            <div className="p-4 rounded-10 bg-primaryColorLight">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  ry="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </label>
      </RadioGroup>

      <div className="flex flex-col gap-3 mt-2">
        <Button
          type="button"
          variant="primary"
          onClick={onContinue}
          disabled={!selectedMethod || isLoading}
          className="w-full"
        >
          {isLoading ? "جاري المعالجة..." : "أكمل التحقق"}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-16 text-textMain hover:text-primaryColor transition-colors text-center"
          disabled={isLoading}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};

export default TwoFactorMethodSelection;

