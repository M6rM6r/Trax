"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import Link from "next/link";
import { ClientsRecord } from "@/lib/types/responseTypes";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { convertDateFormat } from "@/lib/helperFunctions";
import { getFirstTwoWords } from "@/lib/utils";

export const columns: ColumnDef<ClientsRecord>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        name={getFirstTwoWords(row.original?.name)}
        image={""}
        gender={row.original.label}
        online={false}
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="بريد إلكتروني" />
    ),
    cell: ({ row }) => <div>{row.original?.email}</div>,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم الجوال" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original?.country_code}
        {row.original?.phone}+
      </div>
    ),
  },
  {
    accessorKey: "creation_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإنضمام" />
    ),
    cell: ({ row }) => <div>{convertDateFormat(row.original?.created_at)}</div>,
  },

  {
    accessorKey: "numberOfComplaints",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عدد الشكاوى ضده" />
    ),
    cell: ({ row }) => <div>{row.original?.complaints_count} شكوي</div>,
  },

  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الشكوى" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original.is_active === true ? "مفعل" : "غير مفعل"}
        green={row.original.is_active === true ? true : false}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <Link
        href={`/ar/complaintsManagement/drivers/${row.original?.id}`}
        className="text-16 text-primaryColor font-[600]"
      >
        عرض
      </Link>
    ),
  },
];
