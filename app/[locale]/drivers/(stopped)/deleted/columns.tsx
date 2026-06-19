/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { convertDateFormat } from "@/lib/helperFunctions";
import { ServicesTrue } from "@/public/SVG";
import { allEnumsData, EVehicleType } from "@/lib/types/enums";
import { isTruthy } from "@/lib/utils";
import EmptyTableCell from "@/components/shared/EmptyTableCell";

export const columns: ColumnDef<any>[] = [
  // =====================================
  // Select Column
  // =====================================
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

  // =====================================
  // Name
  // =====================================
  {
    accessorKey: "name",
    meta: { name: "اسم السائق" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اسم السائق" />
    ),
    cell: ({ row }) => {
      const name = row.original?.name ?? "غير محدد";
      return (
        <AvatarWithName
          name={name}
          gender={row.original?.gender}
          image={row.original?.profile_image}
          online={Boolean(row.original?.is_online)}
        />
      );
    },
    enableHiding: false,
  },

  // =====================================
  // Phone
  // =====================================
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الجوال" />
    ),
    cell: ({ row }) => {
      const phone = row.original?.mobile;

      if (!isTruthy(phone))
        return <StatusCell text="غير موجود" green={false} />;

      return <div>{phone}</div>;
    },
  },

  // =====================================
  // Block Reason
  // =====================================
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="سبب الحذف" />
    ),
    cell: ({ row }) => {
      const reason = row.original?.blocked_reasons?.reason;

      return reason ? <div>{reason}</div> : <EmptyTableCell text="غير محدد" />;
    },
  },

  // =====================================
  // Service Type
  // =====================================
  {
    accessorKey: "services",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع الخدمة" />
    ),
    cell: ({ row }) => {
      const vehicle = row.original?.vehicle_type;

      const serviceName =
        vehicle === EVehicleType.taxi
          ? allEnumsData.VehicleTypes.ar.taxi
          : vehicle === EVehicleType.wensh
          ? allEnumsData.VehicleTypes.ar.wensh
          : vehicle === EVehicleType.light_transportation
          ? allEnumsData.VehicleTypes.ar.light_transportation
          : vehicle === EVehicleType.fontas
          ? allEnumsData.VehicleTypes.ar.fontas
          : vehicle === EVehicleType.driver_without_car
          ? "سائق بدون سيارة"
          : null;
      return serviceName ? (
        <div>{serviceName}</div>
      ) : (
        <EmptyTableCell text="غير محددة" />
      );
    },
  },
];
