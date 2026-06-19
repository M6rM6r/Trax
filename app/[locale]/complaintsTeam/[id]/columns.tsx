"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import Link from "next/link";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import { DeleteAction, EyeAction } from "@/public/SVG";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import { Member } from "@/lib/types/responseTypes";

export type TeamPerson = Member & {
  is_manager: number; // 0 = عضو, 1 = مدير
};

export const columns: ColumnDef<TeamPerson>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        image={""}
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
    cell: ({ row }) => (
      <div className="flex items-center gap-5">
        <Link href={`#`} className="text-16 text-primaryColor font-[600]">
          <EyeAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="infoPages"
          title="هل أنت متأكد من حذف العضو من الفريق؟"
          description="سيتم حذف هذا العضو من الفريق ولن يتمكن من متابعة أي شكاوى.
يُرجى التأكد من إعادة تعيين الشكاوى المرتبطة به قبل المتابعة."
        />
      </div>
    ),
  },
];
