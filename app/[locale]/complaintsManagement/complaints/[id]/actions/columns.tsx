"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import { DeleteAction } from "@/public/SVG";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الإجراء" />
    ),
    cell: ({ row }) => <div>{row.original?.disciplinary_action?.name_ar}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="النوع" />
    ),
    cell: ({ row }) => {},
    enableHiding: false,
  },
  {
    accessorKey: "note",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="وجهة النظر فى الإجراء" />
    ),
    cell: ({ row }) => <div>{row.original?.note}</div>,
  },

  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <DeleteDialog
        trigger={
          <button>
            <DeleteAction />
          </button>
        }
        id={row.original.id}
        url="complaintActions"
        title="هل أنت متأكد من حذف الإجراء؟"
        description="سيتم حذف هذا الإجراء نهائيًا ولن يظهر للمستخدمين بعد الآن.
هل تريد المتابعة؟"
      />
    ),
  },
];
