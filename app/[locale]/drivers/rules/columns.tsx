"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction, EyeAction } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { RulesRecord } from "@/lib/types/responseTypes";

export const columns: ColumnDef<RulesRecord>[] = [
  {
    accessorKey: "name_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم بالعربية" />
    ),
    cell: ({ row }) => <div>{row.original?.title_ar}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "name_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم بالإنجليزية" />
    ),
    cell: ({ row }) => <div>{row.original?.title_en}</div>,
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
        <Link href={`/ar/drivers/rules/${row.original.id}`}>
          <EyeAction />
        </Link>
        <Link href={`/ar/drivers/rules/${row.original.id}/edit`}>
          <EditAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="rules"
          title="هل أنت متأكد من حذف القاعدة؟"
          description="هل أنت متأكد من حذف هذه القاعدة؟ سيؤدي حذف القاعدة إلى إيقاف تطبيقها على النظام وقد يؤثر على أداء السائقين المرتبطين بها. هذا الإجراء نهائي ولا يمكن التراجع عنه."
        />
      </div>
    ),
  },
];
