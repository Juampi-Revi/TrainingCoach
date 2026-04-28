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
  const { api } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(() => {
    api
      .get<{ notifications: AppNotification[]; unreadCount: number }>("/notifications")
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => { fetch(); }, [fetch]);

  const markAllRead = useCallback(async () => {
    await api.patch("/notifications/read-all", {});
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }, [api]);

  return { notifications, unreadCount, loading, markAllRead, refresh: fetch };
}
