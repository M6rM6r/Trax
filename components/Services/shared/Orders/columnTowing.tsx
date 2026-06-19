"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import Link from "next/link";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import { FuelsOrdersRecord } from "@/lib/types/responseTypes";
import { convertDateFormat, DateFormat } from "@/lib/helperFunctions";
import { Badge } from "@/components/ui/badge";

export const columnTowing: ColumnDef<FuelsOrdersRecord>[] = [
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
    accessorKey: "order_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الطلب" />
    ),
    cell: ({ row }) => <div>{row.original?.id}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        name={row.original?.driver?.name}
        gender={row.original?.driver?.gender}
        image={row.original?.driver?.profile_image}
        online={Boolean(row.original?.driver?.is_online)}
      />
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ و وقت الطلب" />
    ),
    cell: ({ row }) => {
      const formatted = DateFormat(row.original?.created_at);
      return (
        <div className="flex flex-col">
          <span>{formatted.time}</span>
          <span>{formatted.dayMonthYear}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) =>
      row.original?.status === "مقبول" ? (
        <Badge variant={"success"}>مقبول</Badge>
      ) : row.original?.status === "مرفوض" ? (
        <Badge variant={"refused"}>مرفوض</Badge>
      ) : (
        <Badge variant={"new"}>جديد</Badge>
      ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <div className=" flex items-center gap-3">
        <Link
          href={`/ar/services/outages/towing/orders/${row.original?.id}`}
          className="text-16 text-primaryColor font-[600]"
        >
          عرض الطلب
        </Link>
      </div>
    ),
  },
];
