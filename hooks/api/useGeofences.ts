"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { firebaseData } from "@/lib/services/firebaseData";
import type { Geofence } from "@/lib/types/trackingTypes";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "./queryKeys";

export function useGeofences() {
  const companyId = useAuthStore((state) => state.companyId);

  return useQuery<Geofence[]>({
    queryKey: [...queryKeys.geofences, companyId ?? "unassigned"],
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Geofence[]> => {
      return firebaseData.geofences.list();
    },
  });
}

export function useCreateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (geofence: Omit<Geofence, "id">) => {
      return firebaseData.geofences.create(geofence);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Geofence> }) => {
      await firebaseData.geofences.update(id, data);
      return { id, ...data } as Geofence;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await firebaseData.geofences.delete(id);
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.geofences });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
