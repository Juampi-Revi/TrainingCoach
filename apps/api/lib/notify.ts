import { prisma } from "./prisma";
import { isPushConfigured, sendPushNotification } from "./push-notifications";

const pushEnabledCache = new Map<string, { enabled: boolean; fetchedAt: number }>();
const PUSH_CACHE_TTL_MS = 5 * 60 * 1000;

export async function notify(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
}) {
  try {
    await prisma.notification.create({ data: params });
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
