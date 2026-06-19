"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import {
  NotificationRecord,
  NotificationType,
  ServiceTypesAr,
} from "@/lib/types/responseTypes";
import { DeleteAction } from "@/public/SVG";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { EditNotificationDialog } from "@/components/Settings/NotificationSettings/EditNotificationDialog";

const getTypeArabic = (type: NotificationType) => {
  return ServiceTypesAr[type.toLowerCase() as keyof typeof ServiceTypesAr];
};

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الرقم" />
    ),
    cell: ({ row }) => <div className="text-gray-600">{row.original.id}</div>,
  },
  {
    accessorKey: "title_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="إسم الإشعار" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.original.title_ar}</div>
    ),
  },
  {
    accessorKey: "description_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نص الرسالة" />
    ),
    cell: ({ row }) => (
      <div
        className="max-w-[300px] truncate"
        title={row.original.description_ar}
      >
        {row.original.description_ar}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع الإشعار" />
    ),
    cell: ({ row }) => <div>{getTypeArabic(row.original.type)}</div>,
  },
  {
    accessorKey: "channel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="قناة الإشعار" />
    ),
    cell: ({ row }) => <div className="capitalize">{row.original.channel}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original.isActive ? "مفعل" : "غير مفعل"}
        green={row.original.isActive ? true : false}
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <EditNotificationDialog
          notification={row.original}
          onUpdated={() => {
            // This will trigger a refresh of the table data
            window.location.reload();
          }}
        />
        <DeleteDialog
          trigger={
            <button className="hover:opacity-70 transition-opacity duration-200">
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="notification-templates"
          title="هل أنت متأكد من حذف الإشعار؟"
          description="سيتم حذف هذه الإشعار نهائيًا من التطبيق، ولن تكون مرئية للمستخدمين بعد الآن. هل ترغب في المتابعة؟"
        />
      </div>
    ),
  },
];
