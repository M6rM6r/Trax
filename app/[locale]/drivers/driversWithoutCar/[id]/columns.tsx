"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/DataTable/data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { getFirstTwoWords } from "@/lib/utils";

// type TDriversTaxi = {
//   id: number;
//   name: "";
//   appointmentDate: {
//     date: string;
//     time: string;
//   };
//   appointmentStart: {
//     date: string;
//     time: string;
//   };
//   appointmentEnd: {
//     date: string;
//     time: string;
//   };
//   location: string;
//   days: string;
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
      <DataTableColumnHeader column={column} title="اسم العميل" />
    ),
    cell: ({ row }) => <div>{getFirstTwoWords(row.original?.name)}</div>,
    enableHiding: false,
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
    accessorKey: "appointmentStart",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موعد البدء" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.appointmentStart?.time} <br />{" "}
        {row.original.appointmentStart?.date}
      </div>
    ),
  },
  {
    accessorKey: "appointmentEnd",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موعد الإنتهاء" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original.appointmentEnd?.time} <br />{" "}
        {row.original.appointmentEnd?.date}
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="موقع الإلتقاء بالعميل" />
    ),
    cell: ({ row }) => <div>{row.original?.location}</div>,
  },
  {
    accessorKey: "days",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عدد الأيام" />
    ),
    cell: ({ row }) => <div>{row.original?.days}</div>,
  },
  {
    accessorKey: "cost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="إجمالي التكلفة" />
    ),
    cell: ({ row }) => <div>{row.original?.cost}</div>,
  },
  {
    accessorKey: "paymentWay",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="طريقة الدفع" />
    ),
    cell: ({ row }) => <div>{row.original?.paymentWay}</div>,
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الدفع" />
    ),
    cell: ({ row }) => (
      <StatusCell text={row.original?.paymentStatus} green={true} />
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
        viewLink={`drivers/driversWithoutCar/${row.original.id}/profile`}
      />
    ),
  },
];
