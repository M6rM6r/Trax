"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { DeleteAction, EditAction, EyeAction } from "@/public/SVG";
import Link from "next/link";
import DeleteDialog from "@/components/Authorization/DeleteDialog";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { UnitsRecord } from "@/lib/types/responseTypes";
import { useToast } from "@/hooks/use-toast";

// Actions cell component
const ActionsCell = ({ row }: { row: any }) => {
  const { toast } = useToast();

  const handleDeleteClick = (e: React.MouseEvent) => {
    if (row.original.active_drivers_count > 0) {
      e.preventDefault();
      toast({
        description: "لا يمكن حذف وحدة الفونتاس لأن هناك سائقين نشطين مرتبطين بها",
        variant: "destructive",
      });
    }
  };

  return (
    <div className=" flex items-center gap-3">
      <Link href={`/ar/vehicles/units/${row.original.id}`}>
        <EyeAction />
      </Link>
      <Link href={`/ar/vehicles/units/${row.original.id}/edit`}>
        <EditAction />
      </Link>
      {row.original.active_drivers_count > 0 ? (
        <button onClick={handleDeleteClick}>
          <DeleteAction className="opacity-50 cursor-not-allowed" />
        </button>
      ) : (
        <DeleteDialog
          trigger={
            <button>
              <DeleteAction />
            </button>
          }
          id={row.original.id}
          url="fontasUnits"
          title="هل أنت متأكد من حذف وحدة الفونتاس؟"
          description="سيؤدي ذلك إلى إزالة جميع المهام والمحتوى المرتبط بها.
لا يمكن التراجع عن هذا الإجراء بعد تأكيد الحذف."
        />
      )}
    </div>
  );
};

export const columns: ColumnDef<UnitsRecord>[] = [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="يكتب" />
    ),
    cell: ({ row }) => <div>{row.original?.type}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "value",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="القيمة" />
    ),
    cell: ({ row }) => <div>{row.original?.value}</div>,
  },
  {
    accessorKey: "unit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الوحدة" />
    ),
    cell: ({ row }) => <div>{row.original?.unit}</div>,
  },
  {
    accessorKey: "active_drivers_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="السائقين" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-14 font-[600]">
          {row.original?.active_drivers_count || 0}
        </div>
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
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
