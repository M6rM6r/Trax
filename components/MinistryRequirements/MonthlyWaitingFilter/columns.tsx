"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { convertDateFormat } from "@/lib/helperFunctions";

export interface MonthlyWaitingData {
  id?: string | number;
  province_name: string;
  from: string;
  to: string;
  average_waiting_time: string;
}

export const columns: ColumnDef<MonthlyWaitingData>[] = [
  {
    accessorKey: "province_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المدينة" />
    ),
    cell: ({ row }) => (
      <div className="text-16 font-[600]">{row.original.province_name}</div>
    ),
  },
  {
    accessorKey: "date_range",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الفترة الزمنية" />
    ),
    cell: ({ row }) => (
      <div className="text-16 font-[600] text-nowrap">
        {convertDateFormat(row.original.from)} - {convertDateFormat(row.original.to)}
      </div>
    ),
  },
  {
    accessorKey: "average_waiting_time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="متوسط وقت الانتظار" />
    ),
    cell: ({ row }) => (
      <div className="text-16 font-[600]">
        {row.original.average_waiting_time}
      </div>
    ),
  },
];
