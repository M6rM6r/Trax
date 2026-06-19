"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction, EyeAction } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { LabelsRecord } from "@/lib/types/responseTypes";

export const columns: ColumnDef<LabelsRecord>[] = [
  {
    accessorKey: "title_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="	العنوان بالعربية" />
    ),
    cell: ({ row }) => <div>{row.original?.title_ar}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "title_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="العنوان بالإنجليزية	" />
    ),
    cell: ({ row }) => <div>{row.original?.title_en}</div>,
  },
  {
    accessorKey: "color",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اللون" />
    ),
    cell: ({ row }) => (
      <div className=" flex items-center gap-2">
        <p
          className="w-3 h-3 rounded-[1px]  "
          style={{
            backgroundColor: row.original?.color,
          }}
        ></p>{" "}
        {row.original?.color}
      </div>
    ),
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
        <Link href={`/ar/categories/${row.original.id}`}>
          <EyeAction />
        </Link>
        <Link href={`/ar/categories/${row.original.id}/edit`}>
          <EditAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="labels"
          title="هل أنت متأكد من حذف التصنيف؟"
          description="سيتم حذف هذا التصنيف نهائيًا من النظام، ولا يمكن التراجع عن هذا الإجراء."
        />
      </div>
    ),
  },
];
