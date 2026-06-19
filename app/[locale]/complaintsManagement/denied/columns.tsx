"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import Link from "next/link";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الرقم" />
    ),
    cell: ({ row }) => <div>{row.original?.number}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "complainant",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="مقدم الشكوى" />
    ),
    cell: ({ row }) => <div>{row.original?.complainant}</div>,
  },
  {
    accessorKey: "creation_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإنشاء" />
    ),
    cell: ({ row }) => <div>{row.original?.creation_date}</div>,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع الشكوى" />
    ),
    cell: ({ row }) => <div>{row.original?.type}</div>,
  },
  {
    accessorKey: "against",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="شكوى ضد" />
    ),
    cell: ({ row }) => <div>{row.original?.against}</div>,
  },
  {
    accessorKey: "reason",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="سبب الرفض" />
    ),
    cell: ({ row }) => <div>{row.original?.reason}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الشكوى" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original.is_active === 1 ? "مفعل" : "غير مفعل"}
        green={row.original.is_active === 1 ? true : false}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({}) => (
      <Link href={"#"} className="text-16 text-primaryColor font-[600]">
        عرض
      </Link>
    ),
  },
];
