"use client";

import { Row } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eye, Slash, UserRemove } from "@/public/SVG";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import WarningDialog from "../WarningDialog";
import { Separator } from "@/components/ui/separator";
import ErrorDialog from "../ErrorDialog";
import Link from "next/link";
import { useLocale } from "next-intl";
import EditAction from "../EditActionDriver";

// Define an interface that TData must extend
interface WithId {
  id: number; // or string, depending on your data
  is_active: boolean;
}

// Update the props interface to constrain TData
interface DataTableRowActionsProps<TData extends WithId> {
  row: Row<TData>;
  showPopover?: boolean;
  viewLink?: string;
  disabled?: boolean; // NEW
}

export function DataTableRowActions<TData extends WithId>({
  row,
  showPopover = true,
  viewLink,
  disabled = false, // NEW
}: DataTableRowActionsProps<TData>) {
  const locale = useLocale();

  return (
    <div className="flex items-center">
      {/* View Link */}
      {viewLink && (
        <Link
          href={disabled ? "#" : `/${locale}/${viewLink}`}
          className="inline-flex" // keep flex for alignment if needed
          aria-disabled={disabled} // accessibility
        >
          <Eye
            className={`w-[40px] ${
              disabled ? "text-gray400 cursor-not-allowed" : "text-gray600"
            }`}
          />
        </Link>
      )}

      {/* Popover (not disabled) */}
      {showPopover && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <MoreVertical className="!w-5 !h-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </PopoverTrigger>

          <PopoverContent className="p-0 w-[160px]" side="bottom" align="end">
            <EditAction id={row.original.id} />

            <Separator />

            <WarningDialog
              id={row.original.id}
              is_active={row.original.is_active}
              trigger={
                <button className="w-full flex items-center gap-4 justify-start text-12 text-accentWarning hover:bg-accentWarningLight hover:text-accentWarning p-3 relative">
                  <Slash className="w-5 text-accentWarning" />
                  {row.original.is_active ? "حظر المستخدم" : "رفع حظر المستخدم"}
                </button>
              }
            />

            <Separator />

            <ErrorDialog
              id={row.original.id}
              trigger={
                <button className="w-full flex items-center gap-4 justify-start text-12 text-error hover:bg-error50 hover:text-error p-3">
                  <UserRemove className="w-5 text-error" />
                  حذف المستخدم
                </button>
              }
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
