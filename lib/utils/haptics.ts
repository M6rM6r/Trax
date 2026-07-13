export type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "warning";

export function haptic(pattern: HapticPattern = "light"): void {
  if (typeof window === "undefined") return;
  if (!("navigator" in window) || !navigator.vibrate) return;

  const patterns: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 30, 10],
    error: [40, 20, 40],
    warning: [20, 10, 20],
  };

  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    // Silently fail if vibration API is not supported
  }
}

export function hapticTap(): void {
  haptic("light");
}

export function hapticSuccess(): void {
  haptic("success");
}

export function hapticError(): void {
  haptic("error");
}

export function hapticWarning(): void {
  haptic("warning");
}

let lastHapticTime = 0;
export function hapticDebounced(pattern: HapticPattern = "light", delay = 100): void {
  const now = Date.now();
  if (now - lastHapticTime < delay) return;
  lastHapticTime = now;
  haptic(pattern);
}
