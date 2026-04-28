"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./auth";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export function useNotifications() {
  const { api, token, ready } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    if (!ready) return;
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    api
      .get<{ notifications: AppNotification[]; unreadCount: number }>("/notifications")
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api, ready, token]);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) fetch();
    }, 0);

    const onVis = () => {
      if (document.visibilityState === "visible") fetch();
    };

    const onFocus = () => fetch();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") fetch();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [fetch]);

  const markAllRead = useCallback(async () => {
    if (!token) return;
    await api.patch("/notifications/read-all", {});
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }, [api, token]);

  return { notifications, unreadCount, loading, markAllRead, refresh: fetch };
}
