"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      try {
        localStorage.setItem("regen_token", token);
      } catch {}
      router.replace("/semana");
      return;
    }

    router.replace("/login");
  }, [searchParams, router]);

  return null;
}
