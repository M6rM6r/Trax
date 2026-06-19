"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction, EyeAction } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { SubCategoryData } from "@/lib/types/responseTypes";

export const columns: ColumnDef<SubCategoryData>[] = [
  {
    accessorKey: "name_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم بالعربية" />
    ),
    cell: ({ row }) => <div>{row.original?.title_ar}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "name_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الاسم بالإنجليزية" />
    ),
    cell: ({ row }) => <div>{row.original?.title_en}</div>,
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع التطبيق" />
    ),
    cell: ({ row }) => (
      <div>{row.original?.app.map((item) => item.label).join(" , ")}</div>
    ),
  },
  {
    accessorKey: "relatedComplaints",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="عدد الشكاوى المرتبطة" />
    ),
    cell: ({ row }) => <div>{row.original?.complaints_count}</div>,
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
        <Link
          href={`/ar/complaintsManagement/categories/${row.original.parent_id}/subCategories/${row.original.id}`}
        >
          <EyeAction />
        </Link>
        <Link
          href={`${
            row.original.parent_id == null
              ? `/ar/complaintsManagement/categories/${row.original.id}/edit`
              : `/ar/complaintsManagement/categories/${row.original.id}/editType`
          } `}
        >
          <EditAction />
        </Link>
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="complaintCategory"
          title="هل أنت متأكد من حذف النوع؟"
          description="هذا النوع مرتبط بشكاوى مسجلة سابقًا.
قد يؤدي حذفه إلى ظهور الشكاوى المرتبطة بدون تصنيف دقيق.
للحفاظ على سلامة البيانات، يُفضل تعطيله بدلاً من حذفه نهائيًا."
        />
      </div>
    ),
  },
];
