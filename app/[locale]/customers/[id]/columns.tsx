/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/DataTable/data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
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
    meta: { name: "اسم العميل" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اسم العميل" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        gender={row.original?.gender}
        name={row.original?.name}
        image={row.original?.profile_image}
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "appointmentDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موعد التأكيد" />
    ),
    cell: ({ row }) =>
      row.original.appointmentDate?.date &&
      row.original.appointmentDate?.time ? (
        <div className="text-center">
          <div className="font-medium">{row.original.appointmentDate.time}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.appointmentDate.date}
          </div>
        </div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "locationStart",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موقع بدء الرحلة" />
    ),
    cell: ({ row }) =>
      row.original.locationStart ? (
        <div>{row.original.locationStart}</div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "locationEnd",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موقع إنهاء الرحلة" />
    ),
    cell: ({ row }) =>
      row.original.locationEnd ? (
        <div>{row.original.locationEnd}</div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "cost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="إجمالي التكلفة" />
    ),
    cell: ({ row }) =>
      row.original.cost ? (
        <div className="font-medium">{row.original.price} ر.س</div>
      ) : (
        <EmptyTableCell text="0 ر.س" />
      ),
  },
  {
    accessorKey: "paymentWay",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="طريقة الدفع" />
    ),
    cell: ({ row }) =>
      row.original.paymentWay ? (
        <div>{row.original.paymentWay}</div>
      ) : (
        <EmptyTableCell text="غير محددة" />
      ),
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الدفع" />
    ),
    cell: ({ row }) => {
      const isPaid =
        row.original.paymentStatus === "مدفوع" ||
        row.original.paymentStatus === "مكتمل";
      return (
        <StatusCell
          text={row.original.paymentStatus || "غير محدد"}
          green={isPaid}
        />
      );
    },
  },
  {
    accessorKey: "rate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التقييم" />
    ),
    cell: ({ row }) =>
      row.original.rate ? (
        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span>{row.original.rate}</span>
        </div>
      ) : (
        <EmptyTableCell text="لا يوجد" />
      ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الرحلة" />
    ),
    cell: ({ row }) => {
      const isActive =
        row.original.status === "مكتملة" || row.original.status === "نشط";
      return (
        <StatusCell
          text={row.original.status || "غير محددة"}
          green={isActive}
        />
      );
    },
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        showPopover={false}
        viewLink={`drivers/taxi/${row.original.id}/profile`}
      />
    ),
  },
];
