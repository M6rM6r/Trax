/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/DataTable/data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { convertDateFormat } from "@/lib/helperFunctions";
import { allEnumsData, EVehicleType } from "@/lib/types/enums";
import { ServicesTrue } from "@/public/SVG";
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
        {row.original?.country_code}
        {row.original?.mobile}
      </div>
    ),
  },
  {
    accessorKey: "joinDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإنضمام" />
    ),
    cell: ({ row }) => <div>{convertDateFormat(row.original?.created_at)}</div>,
  },
  {
    accessorKey: "services",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الخدمة" />
    ),
    cell: ({ row }) => (
      <div className="bg-[#EBEBEC] flex items-center justify-center gap-3 py-1 rounded-full w-[150px]">
        {`${
          row.original?.vehicle_type == EVehicleType.taxi
            ? allEnumsData.VehicleTypes.ar.taxi
            : row.original?.vehicle_type == EVehicleType.wensh
            ? allEnumsData.VehicleTypes.ar.wensh
            : row.original?.vehicle_type == EVehicleType.light_transportation
            ? allEnumsData.VehicleTypes.ar.light_transportation
            : row.original?.vehicle_type == EVehicleType.fontas
            ? allEnumsData.VehicleTypes.ar.fontas
            : row.original?.vehicle_type == EVehicleType.driver_without_car
            ? "سائق بدون سيارة"
            : row.original?.vehicle_type
        } `}
        <ServicesTrue />
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
];
