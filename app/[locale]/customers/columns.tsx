/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/DataTable/data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { convertDateFormat } from "@/lib/helperFunctions";
import EmptyTableCell from "@/components/shared/EmptyTableCell";

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
        image={row.original.profile_image}
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
    cell: ({ row }) => (
      <div>
        {row.original?.mobile ? (
          <div>
            {row.original?.country_code && (
              <span>{row.original.country_code}</span>
            )}
            {row.original?.mobile}
          </div>
        ) : (
          <EmptyTableCell text="غير محدد" />
        )}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="بريد إلكتروني" />
    ),
    cell: ({ row }) =>
      row.original?.email && row.original?.email !== "" ? (
        <div>{row.original?.email}</div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "joinedDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإنضمام" />
    ),
    cell: ({ row }) => <div>{convertDateFormat(row.original?.created_at)}</div>,
  },
  {
    accessorKey: "totalTrips",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="إجمالى عدد الرحلات" />
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.original?.rides_count || 0}</div>
    ),
  },
  {
    accessorKey: "totalPayments",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="إجمالى المدفوعات" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original?.rides_amount
          ? `${row.original.rides_amount} ر.س`
          : "0 ر.س"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original?.is_active ? "نشط" : "غير نشط"}
        green={row.original?.is_active}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        viewLink={`customers/${row.original?.id}/profile`}
      />
    ),
  },
];
