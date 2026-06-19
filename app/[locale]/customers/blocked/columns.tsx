/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/DataTable/data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import { convertDateFormat } from "@/lib/helperFunctions";
import EmptyTableCell from "@/components/shared/EmptyTableCell";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";

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
    accessorKey: "name",
    meta: { name: "الاسم" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        name={row.original?.name}
        gender={row.original?.gender}
        image={row.original?.profile_image}
        online={Boolean(row.original?.is_online)}
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الجوال" />
    ),
    cell: ({ row }) =>
      row.original?.mobile ? (
        <div>
          {row.original?.country_code && (
            <span>{row.original.country_code}</span>
          )}
          {row.original?.mobile}
        </div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => <StatusCell text="محظور" green={false} />,
  },
  {
    accessorKey: "numberOfBlocked",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عدد مرات الحظر" />
    ),
    cell: ({ row }) =>
      row.original?.blocked_count ? (
        <div className="font-medium">{row.original?.blocked_count}</div>
      ) : (
        <EmptyTableCell text="0" />
      ),
  },
  {
    accessorKey: "blockedDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الحظر" />
    ),
    cell: ({ row }) =>
      row.original?.blocked_reasons?.created_at ? (
        <div>
          {convertDateFormat(row.original?.blocked_reasons?.created_at)}
        </div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="سبب الحظر" />
    ),
    cell: ({ row }) =>
      row.original?.blocked_reasons?.reason ? (
        <div
          className="max-w-[200px] truncate"
          title={row.original?.blocked_reasons?.reason}
        >
          {row.original?.blocked_reasons?.reason}
        </div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "employee",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الموظف" />
    ),
    cell: ({ row }) =>
      row.original?.blocked_reasons?.blocked_by?.name ? (
        <AvatarWithName
          name={row.original?.blocked_reasons?.blocked_by?.name}
          gender={row.original?.blocked_reasons?.blocked_by?.gender || "ادمن"}
          image={row.original?.blocked_reasons?.blocked_by?.profile_image}
          online={false}
        />
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        viewLink={`customers/${row.original?.id}/profile`}
        showPopover={true}
      />
    ),
  },
];
