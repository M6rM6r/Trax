import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";

interface UseServiceDropdownParams {
  onSelectChange?: (value: string) => void;
}

interface UseServiceDropdownReturn {
  handleSelectChange: (value: string, skipLoading?: boolean) => void;
  isTransitionLoadingRef: React.MutableRefObject<boolean>;
  scrollPositionRef: React.MutableRefObject<number>;
}

/**
 * Custom hook for handling service dropdown selection
 * Manages URL parameters, loading states, and scroll position
 *
 * @param onSelectChange - Optional callback when selection changes
 * @returns Select change handler and refs
 */
export const useServiceDropdown = ({
  onSelectChange,
}: UseServiceDropdownParams = {}): UseServiceDropdownReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startLoading } = useLoading();

  // Ref to track if we're in a data transition loading
  const isTransitionLoadingRef = useRef(false);

  // Ref to store scroll position before transition
  const scrollPositionRef = useRef(0);

  /**
   * Handle dropdown selection change
   * Updates URL parameters and manages loading/scroll states
   */
  const handleSelectChange = (value: string, skipLoading = false) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("unit_id");
    params.set("subtype", value);

    // Call optional callback
    if (onSelectChange) {
      onSelectChange(value);
    }

    // Only show loading overlay if this is a user-initiated change (not initial mount)
    if (!skipLoading) {
      // Save current scroll position before loading
      scrollPositionRef.current = window.scrollY;

      // Start loading overlay for data transition
      isTransitionLoadingRef.current = true;
      startLoading();
    }

    // Disable Next.js automatic scroll restoration
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return {
    handleSelectChange,
    isTransitionLoadingRef,
    scrollPositionRef,
  };
};
