"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "brand",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="	العلامة التجارية" />
    ),
    cell: ({ row }) => <div>{row.original?.brand}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "model",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="طراز السيارة	" />
    ),
    cell: ({ row }) => <div>{row.original?.model}</div>,
  },
  {
    accessorKey: "car",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="	السيارة" />
    ),
    cell: ({ row }) => <div>{row.original?.car}</div>,
  },
];
