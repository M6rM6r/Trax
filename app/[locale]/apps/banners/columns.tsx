"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction, EyeAction } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { BannersRecord } from "@/lib/types/responseTypes";

export const columns: ColumnDef<BannersRecord>[] = [
  {
    accessorKey: "title_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="العنوان بالعربية" />
    ),
    cell: ({ row }) => <div>{row.original?.title_ar}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "title_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="العنوان بالإنجليزية" />
    ),
    cell: ({ row }) => <div>{row.original?.title_en}</div>,
  },
  {
    accessorKey: "app_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع التطبيق" />
    ),
    cell: ({ row }) => <div>{row.original?.app}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original.is_active === 1 ? "مفعل" : "غير مفعل"}
        green={row.original.is_active === 1 ? true : false}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <div className=" flex items-center gap-3">
        <Link href={`/ar/apps/banners/${row.original.id}`}>
          <EyeAction />
        </Link>
        <Link href={`/ar/apps/banners/${row.original.id}/edit`}>
          <EditAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="banners"
          title="هل أنت متأكد من حذف اللافتة؟"
          description="سيتم حذف هذه اللافتة نهائيًا من التطبيق، ولن تكون مرئية للمستخدمين بعد الآن. هل ترغب في المتابعة؟"
        />
      </div>
    ),
  },
];
