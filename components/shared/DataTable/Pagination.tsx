"use client";
import React from "react";
import {
  PaginationButton,
  PaginationNextButton,
  PaginationPrevButton,
} from "./PaginationButton";
import { PaginationDots } from "./PaginationDots";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Table } from "@tanstack/react-table";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { useDataTableLoading } from "./DataTableLoadingContext";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  className?: string;
  dynamic?: boolean;
  table: Table<any>;
}

export function Pagination({
  currentPage,
  totalPages,
  className = "",
  dynamic = true,
  table,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { saveScrollPosition } = useScrollPreservation();
  const { startTransition, setIsLoading } = useDataTableLoading();

  const handlePageChange = (page: number) => {
    if (dynamic) {
      saveScrollPosition();
      setIsLoading(true);

      // Create a new URLSearchParams object with the current query parameters
      const params = new URLSearchParams(searchParams.toString());

      // Update the 'page' query parameter
      params.set("page", page.toString());

      // Update the URL with the new query parameters using transition
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    } else {
      table.setPageIndex(page - 1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | "dots")[] = [];

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("dots");
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("dots");
    }

    pages.push(totalPages);

    return pages;
  };

  return (
    <nav
      className={`flex items-center justify-between grow space-x-1 ${className}`}
    >
      <PaginationNextButton
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />

      <div className="hidden sm:flex items-center space-x-1">
        {getPageNumbers().map((page, index) =>
          page === "dots" ? (
            <PaginationDots key={`dots-${index}`} />
          ) : (
            <PaginationButton
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-[43px] h-[43px] flex items-center justify-center rounded-8 border-none ${
                currentPage === page
                  ? " bg-primaryColorLight text-primaryColor"
                  : "text-gray500"
              }`}
            >
              {page}
            </PaginationButton>
          )
        )}
      </div>

      <div className="sm:hidden flex items-center">
        <span className="text-sm text-gray-700">
          صفحه {currentPage} من {totalPages}
        </span>
      </div>

      <PaginationPrevButton
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    </nav>
  );
}
