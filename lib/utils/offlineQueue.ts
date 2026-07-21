const QUEUE_KEY = "trax_offline_queue";

export interface QueuedCheckIn {
  id: string;
  employeeId: string | number;
  employeeName?: string;
  lat: number;
  lng: number;
  geofenceId: string | number;
  timestamp: number;
}

export function getOfflineQueue(): QueuedCheckIn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedCheckIn[]) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(item: QueuedCheckIn): void {
  if (typeof window === "undefined") return;
  const queue = getOfflineQueue();
  queue.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromOfflineQueue(id: string): void {
  if (typeof window === "undefined") return;
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
}

export function hasOfflineQueue(): boolean {
  return getOfflineQueue().length > 0;
}
