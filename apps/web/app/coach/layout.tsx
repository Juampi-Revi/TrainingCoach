"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function CoachLayout({ children }: { children: ReactNode }) {
  const { ready, token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    if (user?.role !== "coach") { router.replace("/semana"); }
  }, [ready, token, user, router]);

  if (!ready) return null;
  if (!token) return null;
  if (user && user.role !== "coach") return null;

  return <>{children}</>;
}
