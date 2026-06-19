"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { allEnumsData } from "@/lib/types/enums";
import { fetcherClient } from "@/lib/fetcherClient";
import { getKeyByLabel } from "@/lib/utils";
import ConfirmStatusDialog from "./ConfirmStatusDialog";

interface WaslStatusCellProps {
  driverId: string | number;
  currentStatus: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  suspended: "bg-gray-100 text-gray-700 border-gray-300",
  wasl_pending: "bg-sky-100 text-sky-700 border-sky-300", // lighter blue
  wasl_accepted: "bg-indigo-200 text-indigo-900 border-indigo-400", // deeper indigo
  wasl_rejected: "bg-red-100 text-red-700 border-red-300",
  active: "bg-green-100 text-green-700 border-green-300",
};

const WaslStatusCell = ({ driverId, currentStatus }: WaslStatusCellProps) => {
  const { DriverStatus } = allEnumsData;

  const initialKey =
    getKeyByLabel(currentStatus, DriverStatus.ar) || currentStatus;

  const [selectedStatus, setSelectedStatus] = useState<string>(initialKey);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Sync local state when props change (fixes bug where deleting a driver causes wrong status to display)
  useEffect(() => {
    const updatedKey = getKeyByLabel(currentStatus, DriverStatus.ar) || currentStatus;
    setSelectedStatus(updatedKey);
  }, [currentStatus, driverId, DriverStatus.ar]);

  const handleStatusChange = (value: string) => {
    if (value !== selectedStatus) {
      setNewStatus(value);
      setOpen(true);
    }
  };

  const confirmUpdate = async () => {
    if (!newStatus) return;
    setLoading(true);
    try {
      const res: any = await fetcherClient(`/drivers/${driverId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.success) throw new Error("فشل تحديث الحالة");

      const returnedKey = getKeyByLabel(res.data.status, DriverStatus.ar);

      setSelectedStatus(returnedKey || newStatus);
      setOpen(false);

      toast({ title: "تم تحديث الحالة بنجاح" });
    } catch (error: any) {
      toast({
        title: error?.message || "فشل التحديث",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentLabel =
    DriverStatus.ar[selectedStatus as keyof typeof DriverStatus.ar] ??
    "غير محددة";

  const colorClasses =
    statusColors[selectedStatus] ?? "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="min-w-[180px]">
      <Select onValueChange={handleStatusChange} value={selectedStatus}>
        <SelectTrigger
          dir="rtl"
          className={`
      w-full justify-between rounded-xl text-right text-sm font-semibold 
      shadow-sm px-3 py-1 ${colorClasses}
      border-0 focus:ring-0 focus:outline-none
    `}
        >
          <span>{currentLabel}</span>
        </SelectTrigger>

        <SelectContent
          dir="rtl"
          className="
      rounded-xl border-0 
      bg-white 
      p-1
      shadow-[0_4px_24px_rgba(0,0,0,0.12)]
    "
        >
          {Object.entries(DriverStatus.ar).map(([key, label]) => (
            <SelectItem
              key={key}
              value={key}
              className={`
    my-1
    rounded-lg
    px-3 py-2
    text-right
    cursor-pointer
    text-sm font-medium
    ${statusColors[key]}
    border-0

    /* remove hover/focus background overrides */
    hover:bg-transparent
    focus:bg-transparent
  `}
            >
              {label as string}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ConfirmStatusDialog
        open={open}
        loading={loading}
        setOpen={setOpen}
        selectedStatus={selectedStatus}
        confirmUpdate={confirmUpdate}
        newStatus={newStatus as string}
      />
    </div>
  );
};

export default WaslStatusCell;
