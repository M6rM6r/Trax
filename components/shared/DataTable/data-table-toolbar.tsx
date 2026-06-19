"use client";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Excel, Export, SearchNormal } from "@/public/SVG";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";
import CustomDialog, { Colors } from "../CustomDialog";
import { DialogClose } from "@/components/ui/dialog";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  topComponent?: React.ReactNode;
  heading?: string;
  filterComponent?: React.ReactNode;
  sortingComponent?: React.ReactNode;
  filterDialog?: React.ReactNode;
  exportLink?: string;
  linkToDeleteAll?: string;
  customizeColumnAppear: boolean;
  searchParamKey?: string;
}

export function DataTableToolbar<TData>({
  table,
  topComponent,
  heading,
  filterComponent,
  sortingComponent,
  filterDialog,
  exportLink,
  linkToDeleteAll,
  customizeColumnAppear,
  searchParamKey,
}: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const { showResponseToast } = useResponseToast();

  // Keep local state synced with URL
  useEffect(() => {
    const key = searchParamKey ?? "searchWord";
    const param = searchParams.get(key);
    setSearchValue(param ?? "");
  }, [searchParams, searchParamKey]);

  // Debounce search param update
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const key = searchParamKey ?? "searchWord";

      if (searchValue) {
        params.set(key, searchValue);
        params.set("page", "1");
      } else {
        params.delete(key);
      }

      router.replace(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, pathname, router, searchParams, searchParamKey]);

  // Excel export
  const handleExcel = async () => {
    if (!exportLink) return;
    try {
      const selectedRows = table.getSelectedRowModel().rows;
      const selectedIds = selectedRows.map((row: any) => row.original?.id);

      let url = `/${exportLink}/export/excel`;
      let options: any = { method: "GET", responseType: "blob" };

      if (selectedIds.length) {
        const formData = new FormData();
        selectedIds.forEach((id) => formData.append("ids[]", id));
        url = `/${exportLink}/export/excel-selected`;
        options = { method: "POST", body: formData, responseType: "blob" };
      }

      const blob = await fetcherClient<Blob>(url, options);
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "export.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error: any) {
      showResponseToast(error.info || "حدث خطأ أثناء تحميل الملف");
    }
  };

  // Bulk delete
  const handleDeleteAll = () => {
    const deleteAll = async () => {
      const allIds = table
        .getSelectedRowModel()
        .rows.map((row: any) => Number(row.original.id));

      const formData = new FormData();
      allIds.forEach((id: any) => formData.append("ids[]", id));

      try {
        const response = await fetcherClient<any>(
          `/${linkToDeleteAll}/bulkDestroy`,
          { method: "POST", body: formData }
        );
        showResponseToast(response);
      } catch (error: any) {
        showResponseToast(error.info);
      } finally {
        router.refresh();
        table.resetRowSelection();
      }
    };
    deleteAll();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h2 className="text-20 text-textMain font-[700]">{heading}</h2>
        {topComponent}
      </div>

      {filterComponent}

      <div className="flex items-center gap-3 flex-wrap">
        {/* Search input */}
        <div
          className={`flex items-center grow md:grow-0 gap-2 relative ${
            !filterDialog && "me-auto"
          }`}
        >
          <Input
            placeholder="ابحث هنا..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-[40px] outline-none w-[165px] md:w-[250px] lg:w-[350px] px-10"
          />
          <SearchNormal className="absolute top-1/2 right-3 -translate-y-1/2" />
        </div>

        {filterDialog}

        {/* Bulk delete */}
        {linkToDeleteAll &&
          (table.getIsSomePageRowsSelected() ||
            table.getIsAllPageRowsSelected()) && (
            <div className="flex items-center gap-2 flex-wrap">
              <CustomDialog
                title="تنبيه هام"
                color={Colors.error}
                className="max-w-[628px]"
                trigger={
                  <button className="flex items-center gap-2 bg-accentDangerLight h-[40px] px-3 rounded-6">
                    <Trash2 className="w-5 text-accentDanger" />
                    <span className="text-16 text-accentDanger font-[600]">
                      حذف التحديد
                    </span>
                  </button>
                }
                content={
                  <div className="flex flex-col items-center justify-center gap-5">
                    <AlertTriangle className="w-20 text-error" />
                    <p className="text-24 text-textMain font-[600]">
                      هل أنت متأكد من الحذف ؟
                    </p>
                    <Button
                      variant={"errorOutline"}
                      className="w-full mt-5"
                      onClick={handleDeleteAll}
                      type="submit"
                    >
                      تأكيد الحذف
                    </Button>

                    <DialogClose asChild>
                      <Button variant={"error"} className="w-full">
                        إلغاء
                      </Button>
                    </DialogClose>
                  </div>
                }
              />

              <p className="flex items-center justify-center h-[40px] px-3 rounded-6 text-primaryColor bg-primaryColorLight">
                المحدده{" "}
                <span className="text-gray500 mx-1">
                  ( {table.getSelectedRowModel().rows.length} عنصر )
                </span>
              </p>
            </div>
          )}

        {sortingComponent}
        {customizeColumnAppear && <DataTableViewOptions table={table} />}

        {exportLink && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-[40px] w-[44px] p-0 data-[state=open]:bg-muted border border-[#D0D5DD]"
              >
                <Export />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[160px]" side="bottom" align="end">
              <button
                className="w-full flex items-center gap-4 justify-start text-12 text-textMain hover:bg-primaryColorLight p-3 cursor-pointer"
                onClick={handleExcel}
              >
                <Excel />
                تصدير كشيت Excel
              </button>
              <Separator />
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
