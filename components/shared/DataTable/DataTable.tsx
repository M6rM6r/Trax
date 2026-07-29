"use client";

import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
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
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Inbox, X } from "lucide-react";
import { useTranslations } from "next-intl";

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
  selectable?: boolean;
  selectedIds?: Array<number | string>;
  onSelectionChange?: (ids: Array<number | string>) => void;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  searchPlaceholder,
  pageSize = 10,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useTranslations("Common.dataTable");

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  const filterableKeys = columns.filter((c) => c.filterable).map((c) => c.key);

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return data;
    const lower = debouncedSearch.toLowerCase();
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
  }, [data, debouncedSearch, filterableKeys, columns]);

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

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(paginatedData.map((r) => r.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (id: number | string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    }
  };

  const allOnPageSelected =
    paginatedData.length > 0 && paginatedData.every((r) => selectedIds.includes(r.id));

  const hasFilterable = filterableKeys.length > 0;

  return (
    <Card className="border border-border bg-card">
      {hasFilterable && (
        <div className="p-4 border-b border-border" role="search">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-sm text-muted-foreground">
              {t("showing", { count: filteredData.length, total: data.length })}
            </p>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder ?? t("searchPlaceholder")}
              className="pr-9 pl-9"
              aria-label={t("search")}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t("clearSearch")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      {!hasFilterable && data.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-sm text-muted-foreground">
            {t("showing", { count: filteredData.length, total: data.length })}
          </p>
        </div>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted">
                {selectable && (
                  <TableHead className="w-12 py-3 px-4">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                      aria-label={t("selectAll")}
                    />
                  </TableHead>
                )}
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    scope="col"
                    aria-sort={
                      sortKey === col.key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : col.sortable
                          ? "none"
                          : undefined
                    }
                    className={`text-right py-3 px-4 text-sm font-semibold text-muted-foreground whitespace-nowrap ${
                      col.sortable ? "cursor-pointer select-none hover:bg-muted" : ""
                    }`}
                    onClick={() => col.sortable && handleSort(col.key)}
                    onKeyDown={(e) => {
                      if (col.sortable && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        handleSort(col.key);
                      }
                    }}
                    tabIndex={col.sortable ? 0 : undefined}
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
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-8 h-8 text-muted-foreground/50" />
                      <span>{t("noResults")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`group border-b border-border hover:bg-muted/50 transition-all duration-150 ${
                      selectedIds.includes(row.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    {selectable && (
                      <TableCell className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                          className="w-4 h-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                          aria-label={t("selectRow", { id: row.id })}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className="py-3 px-4 text-sm text-muted-foreground">
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
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("show")}</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-input rounded-lg px-2 py-1 bg-transparent text-foreground"
                aria-label={t("rowsPerPage")}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>{t("ofTotal", { total: sortedData.length })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                aria-label={t("previousPage")}
                className="text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground" aria-current="page">
                {currentPage} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                aria-label={t("nextPage")}
                className="text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
