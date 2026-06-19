import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { PeakTimeData } from "@/lib/types/responseTypes";
import DeletePeakTime from "./DeletePeakTime";
import EditPeakPrice from "./EditPeakPrice";
import { formatArabicTime } from "@/lib/helperFunctions";

export const getColumnsFule = (existingPeakTimes: PeakTimeData[], fontasUnitLabel?: string, serviceName?: string): ColumnDef<PeakTimeData>[] => [
  {
    accessorKey: "time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الوقت" />
    ),
    cell: ({ row }) => (
      <div>
        {formatArabicTime(row.original?.start_time, row.original?.end_time)}
        {/* من {row.original?.start_time?.slice(0, 5)} الى{" "}
        {row.original?.end_time?.slice(0, 5)} */}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "day",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اليوم" />
    ),
    cell: ({ row }) => <div>{row.original?.translated_day}</div>,
  },
  {
    accessorKey: "Kilo_price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="سعر الكيلو " />
    ),
    cell: ({ row }) => <div>{row.original?.price_per_km}</div>,
  },
  {
    accessorKey: "minute_price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="سعر الدقيقه" />
    ),
    cell: ({ row }) => <div>{row.original?.price_per_minute}</div>,
  },
  {
    accessorKey: "fixed_price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="مصاريف ثابته" />
    ),
    cell: ({ row }) => <div>{row.original?.base_price}</div>,
  },
  {
    accessorKey: "min_price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اقل سعر اجمالي " />
    ),
    cell: ({ row }) => <div>{row.original?.minimum_charge}</div>,
  },
  {
    accessorKey: "waiting_price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="سعر دقيقة الانتظار " />
    ),
    cell: ({ row }) => <div>{row.original?.waiting_cost}</div>,
  },
  {
    accessorKey: "cancel_price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تكلفة الالغاء" />
    ),
    cell: ({ row }) => <div>{row.original?.cancellation_cost}</div>,
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <div className=" flex items-center gap-3">
        <EditPeakPrice data={row.original} serviceName="fuel" fontasUnitLabel={fontasUnitLabel} existingPeakTimes={existingPeakTimes} />
        <DeletePeakTime id={row.original.id} serviceName={serviceName} />
      </div>
    ),
  },
];
