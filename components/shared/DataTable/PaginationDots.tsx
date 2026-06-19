import React from "react";

interface PaginationDotsProps {
  className?: string;
}

export function PaginationDots({ className = "" }: PaginationDotsProps) {
  return (
    <span className={`px-2 text-gray500 text-[12px] ${className}`}>•••</span>
  );
}
