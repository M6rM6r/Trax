"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { EyeAction } from "@/public/SVG";
import Link from "next/link";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import { useParams } from "next/navigation";
import { getFirstTwoWords } from "@/lib/utils";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "name_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم بالعربية" />
    ),
    cell: ({ row }) => <div>{getFirstTwoWords(row.original?.name_ar)}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "name_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم بالإنجليزية" />
    ),
    cell: ({ row }) => <div>{getFirstTwoWords(row.original?.name_en)}</div>,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="النوع" />
    ),
    cell: ({ row }) => <div>{row.original?.type}</div>,
  },
  {
    accessorKey: "relatedComplaints",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عدد الشكاوى المرتبطة" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original?.complaints_count === 0
          ? "لا يوجد"
          : `${row.original?.complaints_count} شكوي`}
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
        text={row.original.is_active === 1 ? "مفعل" : "غير مفعل"}
        green={row.original.is_active === 1 ? true : false}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => {
      return (
        <div className=" flex items-center gap-3">
          <Link href={`/ar/complaintsManagement/actions/${row.original.id}`}>
            <EyeAction />
          </Link>
        </div>
      );
    },
  },
];
