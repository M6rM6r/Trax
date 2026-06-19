"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { useDataTableLoading } from "./DataTableLoadingContext";

interface PageSizeSelectorProps {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export function PageSizeSelector({
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100, 200, 500],
}: PageSizeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { saveScrollPosition } = useScrollPreservation();
  const { startTransition, setIsLoading } = useDataTableLoading();

  // Get current page size from URL, validate it's in the options, or use default
  const urlPageSize = searchParams.get("itemPerPage");
  const currentPageSize =
    urlPageSize && pageSizeOptions.includes(Number(urlPageSize))
      ? urlPageSize
      : defaultPageSize.toString();

  const handlePageSizeChange = (value: string) => {
    saveScrollPosition();
    setIsLoading(true);

    const params = new URLSearchParams(searchParams.toString());

    // Update the itemPerPage parameter (backend uses this name)
    params.set("itemPerPage", value);

    // Reset to page 1 when changing page size
    params.set("page", "1");

    // Navigate with updated parameters using transition for loading state
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-14 text-gray600 whitespace-nowrap">عدد العناصر:</span>
      <Select
        value={currentPageSize}
        onValueChange={handlePageSizeChange}
      >
        <SelectTrigger className="h-10 w-[75px]">
          <SelectValue placeholder={defaultPageSize.toString()} />
        </SelectTrigger>
        <SelectContent side="top" className="max-h-[200px] overflow-y-auto">
          {pageSizeOptions.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
