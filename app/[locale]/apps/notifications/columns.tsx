"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EyeAction, Rotate } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";

export const columns: ColumnDef<any>[] = [
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
    accessorKey: "user_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع المستخدمين" />
    ),
    cell: ({ row }) => <div>{row.original?.user_type}</div>,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإرسال" />
    ),
    cell: ({ row }) => <div>{row.original?.date}</div>,
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
        <Link href={`/ar/apps/notifications/${row.original.id}`}>
          <EyeAction />
        </Link>
        <Rotate className="w-10" />
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="brands"
          title="هل أنت متأكد من حذف الإشعار؟"
          description="سيتم حذف هذا الإشعار نهائيًا ولن يظهر للمستخدمين بعد الآن.
هل تريد المتابعة؟"
        />
      </div>
    ),
  },
];
