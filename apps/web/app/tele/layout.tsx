"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function TeleLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    router.replace("/semana");
  }, [router]);

  void children;
  return null;
}
