// store/pageCache.ts
import { create } from "zustand";

export interface PageCacheState {
  dashboardData: any | null;
  customersData: any | null;
  driversData: any | null;
  tripsData: any | null;
  outagesData: any | null;
  setDashboardData: (data: any) => void;
  setCustomersData: (data: any) => void;
  setDriversData: (data: any) => void;
  setTripsData: (data: any) => void;
  setOutagesData: (data: any) => void;
}

export const usePageCache = create<PageCacheState>((set) => ({
  dashboardData: null,
  customersData: null,
  driversData: null,
  tripsData: null,
  outagesData: null,
  setDashboardData: (data) => set({ dashboardData: data }),
  setCustomersData: (data) => set({ customersData: data }),
  setDriversData: (data) => set({ driversData: data }),
  setTripsData: (data) => set({ tripsData: data }),
  setOutagesData: (data) => set({ outagesData: data }),
}));
