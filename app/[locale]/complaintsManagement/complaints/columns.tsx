"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import Link from "next/link";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { ComplaintsRecord } from "@/lib/types/responseTypes";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import ComplaintAssignedTo from "@/components/Complaints/ComplaintAssignedTo";
import CustomDialog, { Colors } from "@/components/shared/CustomDialog";
import { Plus } from "@/public/SVG";
import { convertDateFormat } from "@/lib/helperFunctions";

export const columns: ColumnDef<ComplaintsRecord>[] = [
  {
    accessorKey: "number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الرقم" />
    ),
    cell: ({ row }) => <div>{row.original?.id}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "against",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="شكوى ضد" />
    ),
    cell: ({ row }) => {
      const against = row.original?.against;
      return typeof against === "string" ? (
        <div>{against}</div>
      ) : (
        <AvatarWithName
          name={against?.name}
          image={against?.image}
          gender={against?.type}
          online={false}
          rating={against?.rating}
        />
      );
    },
  },
  {
    accessorKey: "creation_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تاريخ الإنشاء" />
    ),
    cell: ({ row }) => <div>{convertDateFormat(row.original?.created_at)}</div>,
  },
  {
    accessorKey: "assigned_to",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الموظف المسند له الشكوى" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original?.assigned_to.id ? (
          row.original?.assigned_to?.name
        ) : (
          <CustomDialog
            title="إسناد الشكوى إلى موظف"
            color={Colors.primary}
            trigger={
              <button className=" grow flex items-center gap-1 text-16 text-primaryColor font-[600]">
                <Plus /> إسناد لموظف
              </button>
            }
            content={
              <ComplaintAssignedTo
                team={row?.original?.team}
                id={row?.original?.assigned_to?.id}
                complaint_id={row?.original?.id}
              />
            }
          />
        )}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="تصنيف الشكوى" />
    ),
    cell: ({ row }) => <div>{row.original?.category?.name_en}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الشكوى" />
    ),
    cell: ({ row }) => (
      <StatusCell text={row.original.status?.label} green={false} />
    ),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="الأولوية" />
    ),
    cell: ({ row }) => (
      <StatusCell text={row.original.priority?.label} green={false} />
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
