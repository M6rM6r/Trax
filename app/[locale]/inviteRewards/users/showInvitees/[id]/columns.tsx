"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import { DateFormat } from "@/lib/helperFunctions";
import Link from "next/link";

import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { EyeAction } from "@/public/SVG";

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
        online={Boolean(row.original?.user?.is_online)}
      />
    ),
  },
  {
    accessorKey: "user.registered_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ التسجيل" />
    ),
    cell: ({ row }) => {
      const formatted = DateFormat(row.original?.user?.registered_at);
      return (
        <div className="flex flex-col">
          <span>{formatted.time}</span>
          <span>{formatted.dayMonthYear}</span>
        </div>
      );
    },
  },

  {
    accessorKey: "referee_rides",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عدد الرحلات المكتملة" />
    ),
    cell: ({ row }) => <div>{row.original?.referee_rides}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original?.status}
        green={row.original?.status === "مكتمل"}
      />
    ),
  },
  {
    accessorKey: "reward_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة السحب" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original?.reward_status}
        green={row.original?.reward_status === "مكتمل"}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <Link
        href={
          row.original?.user?.key === "driver"
            ? `/ar/drivers/fontas/${row.original?.id}/profile`
            : `/ar/customers/${row.original?.id}/profile`
        }
      >
        <EyeAction />
      </Link>
    ),
  },
];
