"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction } from "@/public/SVG";
import { DDLListForUserRecord } from "@/lib/types/responseTypes";
import { getFirstTwoWords } from "@/lib/utils";

export const columns: ColumnDef<DDLListForUserRecord>[] = [
  {
    accessorKey: "employe",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الموظف" />
    ),
    cell: ({ row }) => <div>{getFirstTwoWords(row.original?.name)}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الدور" />
    ),
    cell: ({ row }) => <div>{row.original?.email}</div>,
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({}) => (
      <button>
        <DeleteAction />
      </button>
    ),
  },
];
