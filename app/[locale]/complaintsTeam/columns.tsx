"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction, EyeAction } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { TeamsRecord } from "@/lib/types/responseTypes";

export const columns: ColumnDef<TeamsRecord>[] = [
  {
    accessorKey: "title_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اسم الفريق بالعربى " />
    ),
    cell: ({ row }) => <div>{row.original?.title_ar}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "title_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اسم الفريق بالإنجليزية	" />
    ),
    cell: ({ row }) => <div>{row.original?.title_en}</div>,
  },
  {
    accessorKey: "members_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title=" عدد الأعضاء" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/ar/complaintsTeam/${row.original.id}/teamMember`}
        className="text-18 text-primaryColor font-[600] underline"
      >
        {row.original?.members_count} أعضاء
      </Link>
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
        <Link href={`/ar/complaintsTeam/${row.original.id}`}>
          <EyeAction />
        </Link>
        <Link href={`/ar/complaintsTeam/${row.original.id}/edit`}>
          <EditAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="teams"
          title="هل أنت متأكد من حذف الفريق؟"
          description="سيتم حذف هذا الفريق بشكل نهائي من النظام.
لن يكون بمقدورك استرجاع بياناته أو استخدامه في تعيين المهام."
        />
      </div>
    ),
  },
];
