"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import Link from "next/link";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { ClientData } from "@/lib/types/responseTypes";
import { convertDateFormat } from "@/lib/helperFunctions";

export const columns: ColumnDef<ClientData>[] = [
  {
    accessorKey: "complaint_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الشكوى" />
    ),
    cell: ({ row }) => <div>{row.original?.id}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "partyComplaint",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="طرف الشكوى" />
    ),
    cell: ({ row }) => <div>{row.original?.role}</div>,
  },
  {
    accessorKey: "creation_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإنشاء" />
    ),
    cell: ({ row }) => <div>{convertDateFormat(row.original?.created_at)}</div>,
  },
  {
    accessorKey: "complaint_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تصنيف الشكوى" />
    ),
    cell: ({ row }) => <div>{row.original?.category?.name_ar}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الشكوى" />
    ),
    cell: ({ row }) => (
      <StatusCell text={row.original.status?.label} green={true} />
    ),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الأولوية" />
    ),
    cell: ({ row }) => (
      <StatusCell text={row.original.priority?.label} green={true} />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <Link
        href={`/ar/complaintsManagement/complaints/${row.original.id}`}
        className="text-16 text-primaryColor font-[600]"
      >
        عرض
      </Link>
    ),
  },
];
