"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import { DeleteAction } from "@/public/SVG";
import DeleteTeamMember from "@/components/Teams/DeleteTeamMember";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        image={row.original?.image}
        name={row.original?.name}
        gender={""}
        online={false}
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="بريد إلكتروني" />
    ),
    cell: ({ row }) => <div>{row.original?.email}</div>,
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الدور" />
    ),
    cell: ({ row }) => (
      <div>{row.original?.is_manager === 0 ? "عضو" : "مدير"}</div>
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row, table }) => (
      <div className=" flex items-center gap-5">
        <DeleteTeamMember
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          teamsIds={table.getRowModel().rows.map((row) => row.original.id)}
          url="teams"
          title="هل أنت متأكد من حذف العضو من الفريق؟"
          description="سيتم حذف هذا العضو من الفريق ولن يتمكن من متابعة أي شكاوى.
يُرجى التأكد من إعادة تعيين الشكاوى المرتبطة به قبل المتابعة."
        />
      </div>
    ),
  },
];
