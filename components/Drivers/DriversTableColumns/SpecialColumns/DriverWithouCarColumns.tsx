/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DataTableRowActions } from "@/components/shared/DataTable/data-table-row-actions";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { convertDateFormat } from "@/lib/helperFunctions";
import { EVehicleType } from "@/lib/types/enums";
import WaslStatusCell from "@/components/shared/TableCellComponents/WaslStatusCell";
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
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="بريد إلكتروني" />
    ),
    cell: ({ row }) =>
      row.original?.email && row.original?.email !== "" ? (
        <div>{row.original?.email}</div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الجوال" />
    ),
    cell: ({ row }) => <div>{row.original?.mobile}</div>,
  },
  {
    accessorKey: "joinDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإنضمام" />
    ),
    cell: ({ row }) => <div>{convertDateFormat(row.original?.created_at)}</div>,
  },
  {
    accessorKey: "nationalID",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الرقم القومى" />
    ),
    cell: ({ row }) =>
      row.original?.identity_number ? (
        <div>{row.original?.identity_number}</div>
      ) : (
        <EmptyTableCell text="غير محدد" />
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
  {
    accessorKey: "totalTrips",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عدد الرحلات" />
    ),
    cell: ({ row }) => <div>{row.original.rides_count}</div>,
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المدينة" />
    ),
    cell: ({ row }) =>
      row.original.city ? (
        <div>{row.original.city}</div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "region",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المنطقة" />
    ),
    cell: ({ row }) =>
      row.original.region ? (
        <div>{row.original.region}</div>
      ) : (
        <EmptyTableCell text="غير محدد" />
      ),
  },
  {
    accessorKey: "waslStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة وصل" />
    ),
    cell: ({ row }) => (
      <WaslStatusCell
        driverId={row.original.id}
        currentStatus={row.original.status ?? "wasl_pending"}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => {
      const vehicleType: any = row.original?.vehicle_type;

      const pathMap: any = {
        [EVehicleType.taxi]: "taxi",
        [EVehicleType.wensh]: "wensh",
        [EVehicleType.light_transportation]: "lightTransportation",
        [EVehicleType.fontas]: "fontas",
        [EVehicleType.fast_support]: "fast_support",
        [EVehicleType.fuel]: "fuel",
        [EVehicleType.towing]: "towing",
      };

      const pathSegment = vehicleType ? pathMap[vehicleType] || "driversWithoutCar" : "driversWithoutCar";
      const viewLink = `drivers/${pathSegment}/${row.original?.id}/profile`;

      return <DataTableRowActions row={row} viewLink={viewLink} />;
    },
  },
];
