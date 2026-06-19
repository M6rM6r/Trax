"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Inbox } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  pageSize?: number;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  searchPlaceholder = "بحث...",
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  const filterableKeys = columns.filter((c) => c.filterable).map((c) => c.key);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      filterableKeys.some((key) => {
        const col = columns.find((c) => c.key === key);
        if (!col) return false;
        const val = col.sortValue
          ? col.sortValue(row)
          : String((row as Record<string, unknown>)[key] ?? "");
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [data, search, filterableKeys, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = col.sortValue!(a);
      const bVal = col.sortValue!(b);
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const hasFilterable = filterableKeys.length > 0;

  return (
    <Card className="border-0 shadow-lg dark:bg-slate-800">
      {hasFilterable && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="pr-9"
            />
          </div>
        </div>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={`text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-slate-300 ${
                      col.sortable
                        ? "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-700"
                        : ""
                    }`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable &&
                        sortKey === col.key &&
                        (sortDir === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        ))}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-12 text-center text-gray-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-8 h-8 text-gray-300" />
                      <span>لا توجد نتائج مطابقة</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-slate-700/50 dark:border-slate-700"
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className="py-3 px-4 text-sm text-gray-600 dark:text-slate-300"
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {sortedData.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <span>عرض</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-transparent dark:bg-slate-800"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>من {sortedData.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {currentPage} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
