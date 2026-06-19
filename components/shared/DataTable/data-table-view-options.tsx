"use client";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Slide } from "@/public/SVG";
import CustomDialog, { Colors } from "../CustomDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogClose } from "@/components/ui/dialog";
// import { DialogClose } from "@/components/ui/dialog";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <CustomDialog
      title="تخصيص الأعمدة"
      color={Colors.primary}
      className="max-w-[628px]"
      trigger={
        <Button
          variant="ghost"
          className="flex h-[40px] w-[44px] p-0 data-[state=open]:bg-muted border border-[#D0D5DD]"
        >
          <Slide />
        </Button>
      }
      content={
        <div className=" flex flex-col gap-2">
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
            .map((column: any) => {
              const headerContent =
                typeof column.columnDef.header === "function"
                  ? column.columnDef.header({
                      table: table,
                      column: column,
                      header: column.columnDef.header,
                    })
                  : column.columnDef.header || column.id;

              return (
                <div key={column.id} className=" flex flex-col gap-5 ">
                  <div className="flex items-center p-[12px] rounded-[4px] gap-2 shadow-[0px_2px_6px_-2px_rgba(28,59,84,0.06),0px_0px_0px_1px_rgba(28,59,84,0.05)]">
                    <Checkbox
                      id={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {

                        column.toggleVisibility(!!value);
                      }}
                    />
                    <label
                      htmlFor={column.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {headerContent?.props?.title}
                    </label>
                  </div>
                </div>
              );
            })}
          {/* <div className=" flex items-center justify-between mt-5">
            <DialogClose asChild>
              <Button variant="primary">حفظ</Button>
            </DialogClose>
            </div> */}
          <DialogClose asChild>
            <Button
              variant="primaryLight"
              className="mt-5 w-fit ms-auto"
              onClick={() => {
                table.resetColumnVisibility();
              }}
            >
              إعادة تعيين
            </Button>
          </DialogClose>
        </div>
      }
    />
  );
}
