"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

const Index = ({
  text,
  label,
  successMessage = "تم النسخ !",
  className = "",
}: {
  text: string;
  label: string;
  successMessage?: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };
  return (
    <div className={`flex items-center gap-2  ${className}`}>
      {/* Copy Icon */}

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-20 text-textMain font-[700] whitespace-nowrap">
            {label}
          </span>
          <span className="text-16 text-textMain font-[600] break-all">
            {text}
          </span>
        </div>
      </div>
      <button onClick={handleCopy} className="flex-shrink-0 " title="نسخ النص">
        {copied ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : (
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-gray-600" /> نسخ
          </div>
        )}
      </button>

      {/* Success Message */}
      {copied && (
        <div className="flex-shrink-0 text-green-600 text-sm font-medium">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default Index;
