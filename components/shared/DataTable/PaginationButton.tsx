import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PaginationButton({
  onClick,
  disabled,
  children,
  className = "",
}: PaginationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center px-3 py-2 text-sm font-medium
        transition-colors duration-200 border border-[#F4F4F4] hover:bg-primaryColor hover:text-white mx-1
        ${
          disabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
        }
        rounded-md
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export function PaginationPrevButton(
  props: Omit<PaginationButtonProps, "children">
) {
  return (
    <PaginationButton
      {...props}
      className="border border-gray300 hover:border-primaryColor flex items-center gap-1 group"
    >
      <span className="hidden sm:inline text-14 text-gray700 group-hover:text-white ">
        التالي
      </span>
      <ArrowLeft className="w-4 h-4 mx-1 text-gray700 group-hover:text-white" />
    </PaginationButton>
  );
}

export function PaginationNextButton(
  props: Omit<PaginationButtonProps, "children">
) {
  return (
    <PaginationButton
      {...props}
      className="border border-gray300 hover:border-primaryColor flex items-center gap-1 group"
    >
      <ArrowRight className="w-4 h-4 mx-1 text-gray700 group-hover:text-white" />
      <span className="hidden sm:inline text-14 text-gray700 group-hover:text-white ">
        السابق
      </span>
    </PaginationButton>
  );
}
