"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import Link from "next/link";

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
    accessorKey: "user.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        name={row.original?.user?.name}
        gender={row.original?.user?.type}
        image={row.original?.user?.profile_image}
        online={false}
      />
    ),
  },
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="كود الدعوة" />
    ),
    cell: ({ row }) => <div>{row.original?.code}</div>,
  },
  {
    accessorKey: "total_referees",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المدعويين" />
    ),
    cell: ({ row }) => <div>{row.original?.total_referees}</div>,
  },
  {
    accessorKey: "active_referees",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="النشيطين" />
    ),
    cell: ({ row }) => <div>{row.original?.active_referees}</div>,
  },
  {
    accessorKey: "referees_completed",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المكتملين" />
    ),
    cell: ({ row }) => <div>{row.original?.referees_completed}</div>,
  },

  {
    accessorKey: "total_rewarded",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="إجمالي المكافآت" />
    ),
    cell: ({ row }) => <div>{row.original?.total_rewarded} ر.س</div>,
  },
  {
    accessorKey: "rewarded_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة المكافأة" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original?.rewarded_status ? "تم السحب" : "قيد الانتظار"}
        green={row.original?.rewarded_status === 1}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <Link
        href={`/ar/inviteRewards/users/showInvitees/${row?.original?.id}?userkey=${row.original?.user?.key}`}
        className="text-16 text-primaryColor font-[600]"
      >
        عرض المدعوين
      </Link>
    ),
  },
];
