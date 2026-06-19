"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EyeAction } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
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
      <DataTableColumnHeader column={column} title="نوع الحمولة" />
    ),
    cell: ({ row }) => <div>{row.original?.cargo_type}</div>,
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
    cell: ({ row }) => (
      <div className=" flex items-center gap-3">
        <Link href={`/ar/services/lightTransportationGoods/${row.original.id}`}>
          <EyeAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="lightTransportationCargo"
          title="هل أنت متأكد من حذف النوع؟"
          description="هل أنت متأكد من حذف هذا النوع من خدمات النقل الخفيف؟ لن يكون متاحًا للاختيار عند طلب الرحلات الجديدة"
        />
      </div>
    ),
  },
];
