"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction, EyeAction } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { ColorsRecord } from "@/lib/types/responseTypes";
import { getFirstTwoWords } from "@/lib/utils";

export const columns: ColumnDef<ColorsRecord>[] = [
  {
    accessorKey: "name_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم بالعربية" />
    ),
    cell: ({ row }) => <div>{getFirstTwoWords(row.original?.name_ar)}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "name_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم بالإنجليزية" />
    ),
    cell: ({ row }) => <div>{getFirstTwoWords(row.original?.name_en)}</div>,
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
        <Link href={`/ar/vehicles/colors/${row.original.id}`}>
          <EyeAction />
        </Link>
        <Link href={`/ar/vehicles/colors/${row.original.id}/edit`}>
          <EditAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="colors"
          title="هل أنت متأكد من حذف اللون؟"
          description="سيتم حذف اللون من قائمة الاختيارات ولن يكون متاحًا للاستخدام.
هذا الإجراء لا يمكن التراجع عنه بعد التأكيد."
        />
      </div>
    ),
  },
];
