"use client";

import { useState, useMemo, useEffect, useRef, type ReactNode, Fragment } from "react";
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
  hideOnMobile?: boolean;
  mobilePrimary?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: Array<number | string>;
  onSelectionChange?: (ids: Array<number | string>) => void;
  className?: string;
}

const emptySelection: Array<number | string> = [];

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  searchPlaceholder,
  pageSize = 10,
  selectable = false,
  selectedIds = emptySelection,
  onSelectionChange,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnsRef = useRef(columns);
  const t = useTranslations("Common.dataTable");

  columnsRef.current = columns;

  const columnSignature = useMemo(
    () =>
      columns
        .map(
          (c) =>
            `${c.key}:${c.filterable ? 1 : 0}:${c.sortable ? 1 : 0}:${c.sortValue ? 1 : 0}:${c.hideOnMobile ? 1 : 0}:${c.mobilePrimary ? 1 : 0}`
        )
        .join("|"),
    [columns]
  );

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

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return data;
    const lower = debouncedSearch.toLowerCase();
    const currentColumns = columnsRef.current;
    return data.filter((row) =>
      currentColumns.some((col) => {
        if (!col.filterable) return false;
        const val = col.sortValue
          ? col.sortValue(row)
          : String((row as Record<string, unknown>)[col.key] ?? "");
        return String(val).toLowerCase().includes(lower);
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, debouncedSearch, columnSignature]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columnsRef.current.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = col.sortValue!(a);
      const bVal = col.sortValue!(b);
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, sortKey, sortDir, columnSignature]);

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

  const hasFilterable = columns.some((c) => c.filterable);
  const sortableColumns = columns.filter((c) => c.sortable && c.sortValue);
  const primaryCol =
    columns.find((c) => c.mobilePrimary) ||
    columns.find((c) => c.key === "name") ||
    columns.find((c) => c.key !== "actions" && !c.hideOnMobile) ||
    columns[0];
  const actionsCol = columns.find((c) => c.key === "actions");
  const mobileBodyCols = columns.filter(
    (c) => c.key !== primaryCol?.key && c.key !== "actions" && !c.hideOnMobile
  );

  const paginationBlock =
    sortedData.length > 0 ? (
      <div className="flex flex-col gap-3 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{t("show")}</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-lg border border-input bg-transparent px-2 py-1.5 text-foreground"
            aria-label={t("rowsPerPage")}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>{t("ofTotal", { total: sortedData.length })}</span>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            aria-label={t("previousPage")}
            className="min-h-10 min-w-10 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span
            className="min-w-[4.5rem] text-center text-sm text-muted-foreground"
            aria-current="page"
          >
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            aria-label={t("nextPage")}
            className="min-h-10 min-w-10 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <Card className={`overflow-hidden border border-border bg-card ${className ?? ""}`}>
      {hasFilterable && (
        <div className="border-b border-border p-3 sm:p-4" role="search">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("showing", { count: filteredData.length, total: data.length })}
            </p>
            {sortableColumns.length > 0 && (
              <div className="flex items-center gap-2 md:hidden">
                <label
                  htmlFor="data-table-mobile-sort"
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  Sort
                </label>
                <select
                  id="data-table-mobile-sort"
                  className="min-h-10 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                  value={sortKey ? `${sortKey}:${sortDir}` : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) {
                      setSortKey(null);
                      return;
                    }
                    const [key, dir] = v.split(":");
                    setSortKey(key);
                    setSortDir(dir === "desc" ? "desc" : "asc");
                  }}
                >
                  <option value="">—</option>
                  {sortableColumns.map((col) => (
                    <Fragment key={col.key}>
                      <option value={`${col.key}:asc`}>{col.header} ↑</option>
                      <option value={`${col.key}:desc`}>{col.header} ↓</option>
                    </Fragment>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder ?? t("searchPlaceholder")}
              className="h-11 pe-9 ps-9"
              aria-label={t("search")}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t("clearSearch")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      {!hasFilterable && data.length > 0 && (
        <div className="px-3 pb-1 pt-3 sm:px-4">
          <p className="text-sm text-muted-foreground">
            {t("showing", { count: filteredData.length, total: data.length })}
          </p>
        </div>
      )}
      <CardContent className="p-0">
        <div className="md:hidden">
          {paginatedData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
              <span>{t("noResults")}</span>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {paginatedData.map((row) => {
                const selected = selectedIds.includes(row.id);
                return (
                  <li
                    key={row.id}
                    className={`px-3 py-3.5 sm:px-4 ${selected ? "bg-primary/5" : "bg-card"}`}
                  >
                    <div className="flex items-start gap-3">
                      {selectable && (
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                          className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-input text-primary focus:ring-ring"
                          aria-label={t("selectRow", { id: row.id })}
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-2.5">
                        {primaryCol ? (
                          <div className="min-w-0 text-base font-semibold leading-snug text-foreground [&_a]:block [&_a]:truncate">
                            {primaryCol.cell(row)}
                          </div>
                        ) : null}
                        {mobileBodyCols.length > 0 && (
                          <dl className="grid gap-2">
                            {mobileBodyCols.map((col) => (
                              <div
                                key={col.key}
                                className="grid grid-cols-[minmax(4.5rem,30%)_1fr] items-start gap-2 text-sm"
                              >
                                <dt className="pt-0.5 text-xs font-medium text-muted-foreground">
                                  {col.header}
                                </dt>
                                <dd className="min-w-0 break-words text-foreground [&_*]:max-w-full">
                                  {col.cell(row)}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        {actionsCol ? (
                          <div className="-ms-1 flex flex-wrap items-center gap-1 border-t border-border/60 pt-2.5">
                            {actionsCol.cell(row)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted">
                {selectable && (
                  <TableHead className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
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
                    className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-muted-foreground ${
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
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
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
                      <Inbox className="h-8 w-8 text-muted-foreground/50" />
                      <span>{t("noResults")}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`group border-b border-border transition-all duration-150 hover:bg-muted/50 ${
                      selectedIds.includes(row.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    {selectable && (
                      <TableCell className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                          className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
                          aria-label={t("selectRow", { id: row.id })}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className="px-4 py-3 text-sm text-muted-foreground">
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {paginationBlock}
      </CardContent>
    </Card>
  );
}
