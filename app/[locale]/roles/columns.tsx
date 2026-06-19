"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction, EyeAction } from "@/public/SVG";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";

export const columns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[-2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[-2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    enableHiding: false,
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <div className=" flex items-center gap-3">
        <Link href={`/ar/roles/${row.original?.id}`}>
          <EyeAction />
        </Link>
        <Link href={`/ar/roles/${row.original?.id}/edit`}>
          <EditAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original?.id}
          url="roles"
          title="هل أنت متأكد من حذف الدور؟"
          description="هل أنت متأكد أنك تريد حذف هذا الدور؟ حذف الدور سيزيل جميع الصلاحيات المعينة له وقد يؤثر على المستخدمين المرتبطين به. هذا الإجراء لا يمكن التراجع عنه."
        />
      </div>
    ),
  },
];
