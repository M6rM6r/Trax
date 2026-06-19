"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/DataTable/data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";

// type TDriversTaxi = {
//   id: number;
//   name: "";
//   appointmentDate: {
//     date: string;
//     time: string;
//   };
//   amount: string;
//   locationStart: string;
//   locationEnd: string;
//   cost: string;
//   paymentWay: string;
//   paymentStatus: string;
//   rate: string;
//   status: string;
// };

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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <div>{row.original?.customer?.name || row?.original?.driver?.name}</div>
    ),
  },
  {
    accessorKey: "appointmentDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موعد التأكيد" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.appointmentDate?.time} <br />{" "}
        {row.original.appointmentDate?.date}
      </div>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الكمية" />
    ),
    cell: ({ row }) => <div>{row.original?.amount}</div>,
  },
  {
    accessorKey: "locationStart",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موقع توصيل المياه" />
    ),
    cell: ({ row }) => <div>{row.original?.locationStart}</div>,
  },
  {
    accessorKey: "locationEnd",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موقع إنهاء الرحلة" />
    ),
    cell: ({ row }) => <div>{row.original?.locationEnd}</div>,
  },
  {
    accessorKey: "cost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="إجمالي التكلفة" />
    ),
    cell: ({ row }) => <div>{row.original?.final_price}</div>,
  },
  {
    accessorKey: "paymentWay",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="طريقة الدفع" />
    ),
    cell: ({ row }) => <div>{row.original?.payment_method?.title}</div>,
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الدفع" />
    ),
    cell: ({ row }) => (
      <StatusCell text={row.original?.payment_status} green={true} />
    ),
  },
  {
    accessorKey: "rate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التقييم" />
    ),
    cell: ({ row }) => <div>{row.original?.rate}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الرحلة" />
    ),
    cell: ({ row }) => <StatusCell text={row.original?.status} green={false} />,
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        showPopover={false}
        viewLink={`drivers/fontas/${row.original.id}/profile`}
      />
    ),
  },
];
