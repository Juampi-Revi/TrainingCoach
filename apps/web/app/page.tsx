"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Page() {
  const { ready, token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    if (user?.role === "coach") { router.replace("/coach"); return; }
    router.replace("/semana");
  }, [ready, token, user, router]);

  return null;
}
