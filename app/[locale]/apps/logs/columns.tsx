"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { LogsRecord } from "@/lib/types/responseTypes";
import Link from "next/link";
import { EyeAction } from "@/public/SVG";
import { DateFormat } from "@/lib/helperFunctions";

export const columns: ColumnDef<LogsRecord>[] = [
  {
    accessorKey: "hash",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الرقم" />
    ),
    cell: ({ row }) => <div>{row.original?.id}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "link",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الرابط" />
    ),
    cell: ({ row }) => <div>{row.original?.url}</div>,
  },
  {
    accessorKey: "log_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع الإجراء" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original?.method == "PUT"
          ? "تعديل"
          : row.original?.method == "DELETE"
          ? "حذف"
          : "اضافة"}
      </div>
    ),
  },
  {
    accessorKey: "done_by",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تم بواسطة " />
    ),
    cell: ({ row }) => <div>{row.original?.user_id}</div>,
  },
  {
    accessorKey: "ip_address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عنوان ip" />
    ),
    cell: ({ row }) => <div>{row.original?.ip}</div>,
  },
  // {
  //   accessorKey: "model",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="النموذج" />
  //   ),
  //   cell: ({ row }) => <div>{row.original?.model}</div>,
  // },
  {
    accessorKey: "creation_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإنشاء" />
    ),
    cell: ({ row }) => {
      const formatted = DateFormat(row.original?.created_at);
      return (
        <div className="flex flex-col">
          <span>{formatted.time}</span>
          <span>{formatted.dayMonthYear}</span>
        </div>
      );
    },
  },
  // {
  //   accessorKey: "status",
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="الحالة" />
  //   ),
  //   cell: ({ row }) => (
  //     <StatusCell
  //       text={row.original.is_active === 1 ? "مفعل" : "غير مفعل"}
  //       green={row.original.is_active === 1 ? true : false}
  //     />
  //   ),
  // },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <div className=" flex items-center gap-3">
        <Link href={`/ar/apps/logs/${row.original.id}`}>
          <EyeAction />
        </Link>
        {/* <Link   href={`/ar/apps/logs/${row.original.id}/edit`}>
            <EditAction />
          </Link>
          <DeleteDialog
            trigger={
              <button>
                <DeleteAction />
              </button>
            }
            id={row.original.id}
            url="brands"
            title="هل أنت متأكد من حذف الصفحة؟"
            description="سيتم حذف هذه الصفحة نهائيًا ولا يمكن التراجع عن هذا الإجراء.
  هل ترغب في المتابعة؟"
          /> */}
      </div>
    ),
  },
];
