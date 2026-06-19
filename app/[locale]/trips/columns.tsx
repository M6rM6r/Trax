"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/DataTable/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import AvatarWithName from "@/components/shared/TableCellComponents/AvatarWithName";
import StatusCell from "@/components/shared/TableCellComponents/StatusCell";
import { convertDateFormat } from "@/lib/helperFunctions";
import Link from "next/link";
import { EyeAction } from "@/public/SVG";
import EmptyTableCell from "@/components/shared/EmptyTableCell";

export const columns: ColumnDef<any>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[-2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[-2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اسم العميل" />
    ),
    cell: ({ row }) => (
      <AvatarWithName
        name={row.original?.customer?.name}
        gender={row.original?.customer?.gender}
        image={row.original?.customer?.profile_image}
        displayOnlineStatus={false}
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "customer_phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم العميل" />
    ),
    cell: ({ row }) => {
      const phone = row.original?.customer?.phone;
      if (!phone) return "لا يوجد رقم";
      return <div>{phone}</div>;
    },
  },

  {
    accessorKey: "driverName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="اسم السائق" />
    ),
    cell: ({ row }) =>
      row.original?.driver ? (
        <AvatarWithName
          name={row.original?.driver?.name}
          gender={row.original?.driver?.gender}
          image={row.original?.driver?.profile_image}
          displayOnlineStatus={false}
        />
      ) : (
        <EmptyTableCell text=" غير موجود - تم إلغاء الرحلة" />
      ),
    enableHiding: false,
  },
  {
    accessorKey: "driver_phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="رقم السائق" />
    ),
    cell: ({ row }) => {
      const phone = row.original?.driver?.phone;
      const countryCode = row.original?.driver?.country_code;

      if (!phone)
        return (
          <div
            className="
          inline-flex items-center justify-center
          rounded-md px-3 py-1
          bg-muted text-muted-foreground
          text-sm font-medium
          border border-muted-foreground/20
        "
          >
            غير موجود - تم إلغاء الرحلة
          </div>
        );

      return <div>{phone}</div>;
    },
  },

  {
    accessorKey: "service_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="نوع الخدمة" />
    ),
    cell: ({ row }) => <div>{row.original?.service_type}</div>,
  },
  {
    accessorKey: "requested_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title=" موعد الطلب" />
    ),
    cell: ({ row }) => (
      <div>{convertDateFormat(row.original?.requested_at)}</div>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="التكلفة الأولية" />
    ),
    cell: ({ row }) => <div>{row.original?.price} ر.س</div>,
  },
  {
    accessorKey: "ride_distance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="المسافة المقطوعة" />
    ),
    cell: ({ row }) => (
      <div>
        {row.original?.ride_distance == null
          ? "غير محددة"
          : `${row.original?.ride_distance} ك.م`}
      </div>
    ),
  },
  {
    accessorKey: "ride_duration",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="مدة الرحلة" />
    ),
    cell: ({ row }) => (
      <div>{parseFloat(row.original?.ride_duration ?? 0).toFixed(2)}دقيقة</div>
    ),
  },
  {
    accessorKey: "payment_method",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="طريقة الدفع" />
    ),
    cell: ({ row }) => (
      <div>
        <span>{row.original?.payment_method?.title ?? "غير محددة"}</span>
      </div>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الدفع" />
    ),
    cell: ({ row }) => {
      const paymentStatusKey = row.original?.payment_status_key.toLowerCase();
      return (
        <StatusCell
          text={row.original?.payment_status}
          yellow={paymentStatusKey === "pending" ? true : false}
          green={paymentStatusKey === "paid" ? true : false}
        />
      );
    },
  },
  {
    accessorKey: "tripStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="حالة الرحلة" />
    ),
    cell: ({ row }) => (
      <StatusCell
        text={row.original?.status} // consistent value
        green={
          row.original?.status === "الرحلة اكتملت" ||
          row.original?.status === "مقبول"
        } // consistent value
      />
    ),
  },
  {
    id: "actions",
    header: "الإجراء",
    cell: ({ row }) => (
      <Link href={`/ar/trips/${row.original.id}`}>
        <EyeAction />
      </Link>
    ),
  },
];
