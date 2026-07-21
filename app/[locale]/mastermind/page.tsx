"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MastermindPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/ar/mastermind/login");
  }, [router]);

  return null;
}
