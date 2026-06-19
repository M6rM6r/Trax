"use client";

import { DataTable } from "@/components/shared/DataTable/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ReactNode } from "react";

interface DataTableWrapperProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  heading?: string;
  currentPage?: number;
  totalPages?: number;
  topComponent?: ReactNode;
  filterComponent?: ReactNode;
  sortingComponent?: ReactNode;
  filterDialog?: ReactNode;
  exportLink?: string;
  linkToDeleteAll?: string;
}

export default function DataTableWrapper<T>({
  columns,
  data,
  heading,
  currentPage,
  totalPages,
  topComponent,
  filterComponent,
  sortingComponent,
  filterDialog,
  exportLink,
  linkToDeleteAll,
}: DataTableWrapperProps<T>) {
  // Remove client-side sorting since it's handled by server
  return (
    <>
      <DataTable
        columns={columns}
        data={data} // Pass original data without client-side sorting
        heading={heading}
        currentPage={currentPage}
        totalPages={totalPages}
        topComponent={topComponent}
        filterComponent={filterComponent ?? null}
        sortingComponent={sortingComponent ?? null}
        filterDialog={filterDialog ?? null}
        exportLink={exportLink}
        linkToDeleteAll={linkToDeleteAll}
      />
    </>
  );
}
