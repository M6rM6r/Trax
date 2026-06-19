"use client";

import { useState, useMemo } from "react";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CancellationReasonRecord, CancellationReasonService } from "@/lib/types/responseTypes";
import { AddEditReasonDialog } from "./AddEditReasonDialog";
import DataTableWrapper from "@/components/shared/DataTableWrapper";
import { FilterComponent } from "./FilterComponent";
import { useFetchEnums } from "@/hooks/useAllEnums";
import { Add } from "@/public/SVG";
import { useRouter } from "next/navigation";
import { fetcherClient } from "@/lib/fetcherClient";
import { useResponseToast } from "@/lib/toastUtils";

interface CancellationReasonsClientProps {
  initialReasons: CancellationReasonRecord[];
  serviceList: CancellationReasonService[];
  locale: string;
}

export default function CancellationReasonsClient({
  initialReasons,
  serviceList,
  locale,
}: CancellationReasonsClientProps) {
  const router = useRouter();

  // Fetch enums once at the parent level
  const { data: enumsData } = useFetchEnums();
  const { showResponseToast } = useResponseToast();

  // Local state management
  const [reasons, setReasons] = useState<CancellationReasonRecord[]>(initialReasons);
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<CancellationReasonRecord | null>(null);

  // Filter reasons based on selections
  const filteredReasons = useMemo(() => {
    return reasons.filter((reason) => {
      // For service filtering - check if reason has services with matching ID
      const matchesService = selectedService === "all" ||
        (reason.services && reason.services.some(service => service.id === parseInt(selectedService)));

      const matchesAudience = selectedAudience === "all" || reason.category === selectedAudience;
      return matchesService && matchesAudience;
    });
  }, [reasons, selectedService, selectedAudience]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: reasons.length,
    users: reasons.filter((r) => r.category === "customer").length,
    captains: reasons.filter((r) => r.category === "driver").length,
    filtered: filteredReasons.length,
  }), [reasons, filteredReasons]);

  // CRUD operations
  const handleAddReason = async (newReason: CancellationReasonRecord) => {
    // Optimistic update
    setReasons([...reasons, newReason]);
    setIsAddDialogOpen(false);

    // Refresh the page data from server
    router.refresh();
  };

  const handleEditReason = async (updatedReason: CancellationReasonRecord) => {
    // Optimistic update
    setReasons(
      reasons.map((reason) =>
        reason.id === updatedReason.id ? updatedReason : reason
      )
    );
    setEditingReason(null);

    // Refresh the page data from server
    router.refresh();
  };

  const handleDeleteReason = async (id: number) => {
    // Optimistic update
    const originalReasons = reasons;
    setReasons(reasons.filter((reason) => reason.id !== id));

    try {
      // Call the DELETE API
      const response = await fetcherClient<{ success: boolean; message: string }>(
        `/cancellation_reasons/delete/${id}`,
        {
          method: "DELETE",
        }
      );

      // Show toast notification
      showResponseToast(response);

      // Refresh the page data from server
      router.refresh();
    } catch (error) {
      console.error("Error deleting cancellation reason:", error);
      // Revert optimistic update on error
      setReasons(originalReasons);
    }
  };

  const handleToggleActive = async (id: number) => {
    const reason = reasons.find((r) => r.id === id);
    if (!reason) return;

    const newStatus = reason.status === "active" ? "disabled" : "active";

    // Optimistic update
    setReasons(
      reasons.map((r) =>
        r.id === id ? { ...r, status: newStatus } : r
      )
    );

    try {
      // Call the API to update status
      const { fetcherClient } = await import("@/lib/fetcherClient");

      const response = await fetcherClient<{ success: boolean; message: string; data: any }>(
        `/cancellation_reasons/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason_ar: reason.reason_ar,
            reason_en: reason.reason_en,
            category: reason.category,
            sorting: reason.sorting,
            status: newStatus,
            service_ids: reason.services?.map(s => s.id) || [],
          }),
        }
      );

      if (response.success) {
        // Update with preserved services
        setReasons(
          reasons.map((r) =>
            r.id === id ? { ...r, ...response.data, services: reason.services, status: newStatus } : r
          )
        );
      }

      // Refresh the page data from server
      router.refresh();
    } catch (error) {
      console.error("Error toggling status:", error);
      // Revert optimistic update on error
      setReasons(
        reasons.map((r) =>
          r.id === id ? { ...r, status: reason.status } : r
        )
      );
    }
  };

  const openEditDialog = (reason: CancellationReasonRecord) => {
    setEditingReason(reason);
  };

  const handleResetFilters = () => {
    setSelectedService("all");
    setSelectedAudience("all");
  };

  return (
    <>
      <DataTableWrapper
        columns={columns(handleToggleActive, handleDeleteReason, openEditDialog)}
        data={filteredReasons}
        heading="أسباب الإلغاء"
        currentPage={1}
        totalPages={1}
        topComponent={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              asChild
            >
              <Link href={`/${locale}/apps/cancellationReasons/statistics`}>
                عرض الإحصائيات
              </Link>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsAddDialogOpen(true)}
            >
              إضافة سبب جديد
              <Add className="w-6 text-white" />
            </Button>
          </div>
        }
        filterComponent={
          <FilterComponent
            selectedService={selectedService}
            selectedAudience={selectedAudience}
            onServiceChange={setSelectedService}
            onAudienceChange={setSelectedAudience}
            onReset={handleResetFilters}
            stats={stats}
            enumsData={enumsData}
            serviceList={serviceList}
          />
        }
      />

      {/* Add Dialog */}
      <AddEditReasonDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddReason}
        mode="add"
        enumsData={enumsData}
        serviceList={serviceList}
      />

      {/* Edit Dialog */}
      {editingReason && (
        <AddEditReasonDialog
          open={!!editingReason}
          onOpenChange={(open) => !open && setEditingReason(null)}
          onSave={handleEditReason}
          mode="edit"
          initialData={editingReason}
          enumsData={enumsData}
          serviceList={serviceList}
        />
      )}
    </>
  );
}
