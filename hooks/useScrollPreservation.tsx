"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function useScrollPreservation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const scrollPos = sessionStorage.getItem(`scrollPos:${pathname}`);
    if (scrollPos) {
      window.scrollTo(0, parseInt(scrollPos));
      sessionStorage.removeItem(`scrollPos:${pathname}`);
    }
  }, [pathname, searchParams]);

  const saveScrollPosition = () => {
    sessionStorage.setItem(`scrollPos:${pathname}`, window.scrollY.toString());
  };

  return { saveScrollPosition };
}
