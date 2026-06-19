import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { PeakTimeData } from "@/lib/types/responseTypes";
import DeletePeakTime from "./DeletePeakTime";
import EditPeakPrice from "./EditPeakPrice";
import { formatArabicTime } from "@/lib/helperFunctions";

export const getColumnsDefault = (existingPeakTimes: PeakTimeData[], fontasUnitLabel?: string, serviceName?: string): ColumnDef<PeakTimeData>[] => {
  const isFontas = serviceName === "fontas";

  const baseColumns: ColumnDef<PeakTimeData>[] = [
    {
      accessorKey: "time",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="الوقت" />
      ),
      cell: ({ row }) => (
        <div>
          {formatArabicTime(row.original?.start_time, row.original?.end_time)}
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
      enableHiding: false,
    },
  ];

  const fontasColumns: ColumnDef<PeakTimeData>[] = [
    {
      accessorKey: "fixed_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="سعر ثابت" />
      ),
      cell: ({ row }) => <div>{row.original?.base_price}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "Kilo_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="سعر الكيلو" />
      ),
      cell: ({ row }) => <div>{row.original?.price_per_km}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "minute_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="سعر الدقيقة" />
      ),
      cell: ({ row }) => <div>{row.original?.price_per_minute}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "free_km",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="الكيلوات المجانية" />
      ),
      cell: ({ row }) => <div>{row.original?.free_km || "-"}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "cancel_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="سعر الالغاء" />
      ),
      cell: ({ row }) => <div>{row.original?.cancellation_cost}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "cancellation_time",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="وقت الالغاء (بالدقائق)" />
      ),
      cell: ({ row }) => <div>{row.original?.cancellation_time || "-"}</div>,
      enableHiding: false,
    },
  ];

  const otherServicesColumns: ColumnDef<PeakTimeData>[] = [
    {
      accessorKey: "Kilo_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="سعر الكيلو " />
      ),
      cell: ({ row }) => <div>{row.original?.price_per_km}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "minute_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="سعر الدقيقه" />
      ),
      cell: ({ row }) => <div>{row.original?.price_per_minute}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "fixed_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="مصاريف ثابته" />
      ),
      cell: ({ row }) => <div>{row.original?.base_price}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "min_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="اقل سعر اجمالي " />
      ),
      cell: ({ row }) => <div>{row.original?.minimum_charge}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "waiting_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="سعر دقيقة الانتظار " />
      ),
      cell: ({ row }) => <div>{row.original?.waiting_cost}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "cancel_price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="تكلفة الالغاء" />
      ),
      cell: ({ row }) => <div>{row.original?.cancellation_cost}</div>,
      enableHiding: false,
    },
  ];

  const actionColumn: ColumnDef<PeakTimeData> = {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <div className=" flex items-center gap-3">
        <EditPeakPrice data={row.original} fontasUnitLabel={fontasUnitLabel} existingPeakTimes={existingPeakTimes} serviceName={serviceName} />
        <DeletePeakTime id={row.original.id} serviceName={serviceName} />
      </div>
    ),
    enableHiding: false,
  };

  return [
    ...baseColumns,
    ...(isFontas ? fontasColumns : otherServicesColumns),
    actionColumn,
  ];
};
