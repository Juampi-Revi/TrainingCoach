import { prisma } from "./prisma";
import { isPushConfigured, sendPushNotification } from "./push-notifications";
import type { NotificationContext } from "@regen/types";
import type { Prisma } from "@prisma/client";

const pushEnabledCache = new Map<string, { enabled: boolean; fetchedAt: number }>();
const PUSH_CACHE_TTL_MS = 5 * 60 * 1000;

export async function notify(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
  context?: NotificationContext;
}) {
  const context = params.context
    ? (params.context as Prisma.InputJsonValue)
    : undefined;

  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        linkUrl: params.linkUrl,
        ...(context !== undefined ? { context } : {}),
      },
    });
  } catch (error) {
    console.error("[notify] failed to create notification", {
      userId: params.userId,
      type: params.type,
      error,
    });
    return;
  }

  if (!isPushConfigured()) return;

  try {
    const cached = pushEnabledCache.get(params.userId);
    const now = Date.now();
    if (!cached || now - cached.fetchedAt > PUSH_CACHE_TTL_MS) {
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId: params.userId },
        select: { pushNotifications: true },
      });
      pushEnabledCache.set(params.userId, { enabled: !!settings?.pushNotifications, fetchedAt: now });
    }

    const enabled = pushEnabledCache.get(params.userId)?.enabled ?? false;
    if (!enabled) return;

    await sendPushNotification(params.userId, {
      title: params.title,
      body: params.body ?? "",
      tag: params.type,
      data: { url: params.linkUrl ?? undefined, type: params.type },
    });
  } catch (error) {
    console.error("[notify] failed to send push notification", {
      userId: params.userId,
      type: params.type,
      error,
    });
  }
}
