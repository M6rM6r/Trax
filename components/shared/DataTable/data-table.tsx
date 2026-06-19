"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { TableLoadingOverlay } from "./TableLoadingOverlay";
import { DataTableLoadingProvider, useDataTableLoading } from "./DataTableLoadingContext";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchParamKey?: string;
  topComponent?: React.ReactNode;
  heading?: string;
  filterComponent?: React.ReactNode;
  sortingComponent?: React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  filterDialog?: React.ReactNode;
  exportLink?: string;
  linkToDeleteAll?: string;
  customizeColumnAppear?: boolean;
}

function DataTableContent<TData, TValue>({
  columns,
  data,
  searchParamKey,
  topComponent,
  heading,
  filterComponent,
  sortingComponent,
  currentPage,
  totalPages,
  filterDialog,
  exportLink,
  linkToDeleteAll,
  customizeColumnAppear = true,
}: DataTableProps<TData, TValue>) {
  const { isLoading, setIsLoading } = useDataTableLoading();
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Reset client-side UI states when new server data arrives
  React.useEffect(() => {
    setRowSelection({});
    // Reset loading state when new data arrives
    setIsLoading(false);
  }, [data, setIsLoading]);

  // Add maximum timeout for loading state (5 seconds)
  React.useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5 seconds max - prevents spinner from spinning forever

      return () => clearTimeout(timeout);
    }
  }, [isLoading, setIsLoading]);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Pagination is handled server-side
    manualFiltering: true,
    manualSorting: true,
  });

  return (
    <div className="p-5 rounded-[12px] bg-white border border-gray200 flex flex-col gap-5">
      <DataTableToolbar
        table={table}
        searchParamKey={searchParamKey}
        topComponent={topComponent}
        heading={heading}
        filterComponent={filterComponent}
        filterDialog={filterDialog}
        sortingComponent={sortingComponent}
        exportLink={exportLink}
        linkToDeleteAll={linkToDeleteAll}
        customizeColumnAppear={customizeColumnAppear}
      />

      <div className="rounded-[12px] bg-white border border-gray200 overflow-x-auto relative">
        <TableLoadingOverlay isLoading={isLoading} />
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-right text-16 text-gray600 font-[600]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {data && data.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-right text-18 text-gray600 font-[600] text-nowrap min-w-fit"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length || 1}
                  className="h-24 text-center text-16 text-gray600"
                >
                  لا يوجد بيانات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  return (
    <DataTableLoadingProvider>
      <DataTableContent {...props} />
    </DataTableLoadingProvider>
  );
}
