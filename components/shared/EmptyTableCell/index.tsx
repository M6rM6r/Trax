import React, { FC } from "react";

interface IProps {
  text: string;
}

const EmptyTableCell: FC<IProps> = ({ text }) => {
  return (
    <div
      className="
    inline-flex items-center justify-center
    rounded-md px-3 py-1.5
    text-sm font-medium
    bg-amber-50
    text-amber-700
    border border-amber-200
    gap-1.5
    rtl
  "
    >
      {text ?? "غير متوفر"}
      <span
        className="
      w-4 h-4 flex items-center justify-center
      text-amber-600
      text-xs
      font-bold
    "
      >
        !
      </span>
    </div>
  );
};

export default EmptyTableCell;
