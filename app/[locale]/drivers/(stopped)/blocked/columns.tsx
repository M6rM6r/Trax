"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/DataTable/data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import { convertDateFormat } from "@/lib/helperFunctions";
import { ServicesTrue } from "@/public/SVG";
import { allEnumsData, EVehicleType } from "@/lib/types/enums";

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
    cell: ({ row }) => (
      <div>
        {row.original?.country_code}
        {row.original?.mobile}+
      </div>
    ),
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
    accessorKey: "numberOfBlocked",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عدد مرات الحظر" />
    ),
    cell: ({ row }) => <div>{row.original?.blocked_count}</div>,
  },
  {
    accessorKey: "blockedDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الحظر" />
    ),
    cell: ({ row }) => (
      <div>{convertDateFormat(row.original?.blocked_reasons?.created_at)}</div>
    ),
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="سبب الحظر" />
    ),
    cell: ({ row }) => <div>{row.original?.blocked_reasons?.reason}</div>,
  },
  {
    accessorKey: "employee",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الموظف" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        name={row.original?.blocked_reasons?.blocked_by?.name}
        gender={"ادمن"}
        image={row.original?.blocked_reasons?.blocked_by?.profile_image}
        online={false}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => {
      const vehicleType: any = row.original?.vehicle_type;
      let viewLink = "#";

      if (vehicleType) {
        const pathMap: any = {
          [EVehicleType.taxi]: "taxi",
          [EVehicleType.wensh]: "wensh",
          [EVehicleType.light_transportation]: "lightTransportation",
          [EVehicleType.fontas]: "fontas",
        };

        const pathSegment = pathMap[vehicleType] || "driversWithoutCar";
        viewLink = `drivers/${pathSegment}/${row.original?.id}/profile`;
      }
      return <DataTableRowActions row={row} viewLink={viewLink} />;
    },
  },
];
