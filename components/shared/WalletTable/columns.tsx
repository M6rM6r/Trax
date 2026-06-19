"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { convertDateFormat } from "@/lib/helperFunctions";
import RefundProcess from "../RefundProcess";
import EmptyTableCell from "../EmptyTableCell";

// type TWallet = {
//   id: number;
//   amount: number;
//   type: string;
//   payment_method: string;
//   transaction_id: string;
//   url: string;
//   reference: null;
//   is_active: number;
//   created_at: string;
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
    accessorKey: "transactionNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم المعاملة" />
    ),
    cell: ({ row }) =>
      row.original.transaction_id ? (
        <div>{row.original.transaction_id}</div>
      ) : (
        <EmptyTableCell text="غير محدد!" />
      ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المبلغ" />
    ),
    cell: ({ row }) => <div>{row.original.amount}</div>,
  },
  {
    accessorKey: "refundAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="مبلغ المرتجع" />
    ),
    cell: ({ row }) =>
      row.original.refundAmount ? (
        <div>{row.original.refundAmount}</div>
      ) : (
        <EmptyTableCell text="غير محدد!" />
      ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="النوع" />
    ),
    cell: ({ row }) => <div>{row.original.type}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => {
      const status = row.original.status?.toLowerCase();

      const getStatusStyle = () => {
        switch (status) {
          case "success":
          case "نجاح":
            return "bg-green-100 text-green-700 border border-green-300";
          case "fail":
          case "failed":
          case "فشل":
            return "bg-red-100 text-red-700 border border-red-300";
          case "pending":
          case "معلق":
            return "bg-yellow-100 text-yellow-700 border border-yellow-300";
          default:
            return "bg-gray-100 text-gray-600 border border-gray-300";
        }
      };

      return (
        <div
          className={`px-3 py-1 rounded-md text-sm font-medium w-fit ${getStatusStyle()}`}
        >
          {row.original.status === "success"
            ? "ناجحة"
            : row.original.status === "failed"
            ? "فاشلة"
            : row.original.status === "success" && "قيد الإنتظار"}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="طريقة الدفع او السداد" />
    ),
    cell: ({ row }) => <div>{row.original.payment_method}</div>,
  },
  {
    accessorKey: "refundDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ المرتجع" />
    ),
    cell: ({ row }) =>
      row.original.refundDate ? (
        <div>{convertDateFormat(row.original.refundDate)}</div>
      ) : (
        <EmptyTableCell text="غير محدد!" />
      ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التاريخ" />
    ),
    cell: ({ row }) => (
      <div>{convertDateFormat(row.original.requested_at)}</div>
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({}) => {
      return <RefundProcess />;
    },
  },
];
