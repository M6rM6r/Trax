"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction } from "@/public/SVG";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { CancellationReasonRecord } from "@/lib/types/responseTypes";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const columns = (
  onToggleActive: (id: number) => void,
  onDelete: (id: number) => void,
  onEdit: (reason: CancellationReasonRecord) => void
): ColumnDef<CancellationReasonRecord>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم التعريف" />
    ),
    cell: ({ row }) => <div>#{row.original.id}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "reason_ar",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="السبب بالعربية" />
    ),
    cell: ({ row }) => <div>{row.original.reason_ar}</div>,
  },
  {
    accessorKey: "reason_en",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="السبب بالإنجليزية" />
    ),
    cell: ({ row }) => <div dir="ltr">{row.original.reason_en}</div>,
  },
  {
    accessorKey: "services",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع الخدمة" />
    ),
    cell: ({ row }) => {
      const services = row.original.services || [];
      const remainingServices = services.slice(3);

      return (
        <div className="flex items-center gap-2 flex-wrap">
          {services.length > 0 ? (
            services.slice(0, 3).map((service, index) => (
              <Badge
                key={index}
                className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-full"
              >
                {service.title_ar}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400">لا توجد خدمات</span>
          )}
          {services.length > 3 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="outline-none">
                  <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full cursor-pointer">
                    +{services.length - 3}
                  </Badge>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-xs" align="start" side="top">
                <div className="flex flex-col gap-2">
                  <p className="font-semibold text-sm mb-1">الخدمات الإضافية:</p>
                  <div className="flex flex-wrap gap-2">
                    {remainingServices.map((service, index) => (
                      <Badge
                        key={index}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-full"
                      >
                        {service.title_ar}
                      </Badge>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الفئة" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.category === "customer" ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full">
            عميل
          </Badge>
        ) : (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 rounded-full">
            كابتن
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "sorting",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الترتيب" />
    ),
    cell: ({ row }) => <div>{row.original.sorting}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الحالة" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Switch
          checked={row.original.status === "active"}
          onCheckedChange={() => onToggleActive(row.original.id)}
        />
        <StatusCell
          text={row.original.status === "active" ? "مفعل" : "غير مفعل"}
          green={row.original.status === "active"}
        />
      </div>
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <button
          onClick={() => onEdit(row.original)}
          className="hover:opacity-70 transition-opacity"
        >
          <EditAction />
        </button>
        <DeleteDialog
          trigger={
            <button className="hover:opacity-70 transition-opacity">
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          title="هل أنت متأكد من حذف سبب الإلغاء؟"
          description="سيتم حذف هذا السبب نهائيًا من النظام، ولن يكون متاحاً للعملاء أو الكباتن."
          callBack={() => onDelete(row.original.id)}
        />
      </div>
    ),
  },
];
