import webpush from "web-push";
import { prisma } from "./prisma";

// Configure VAPID keys (should be in env vars)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    [key: string]: string | undefined;
  };
}

export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  const notificationPayload = JSON.stringify({
    notification: {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/icon-192x192.png",
      tag: payload.tag || "default",
      requireInteraction: false,
      data: payload.data || {},
    },
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        notificationPayload
      );
      success++;
    } catch (error) {
      failed++;
      // If subscription is invalid, remove it
      if ((error as webpush.WebPushError)?.statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      }
    }
  }

  return { success, failed };
}

export function isPushConfigured(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey);
}

export { webpush, vapidPublicKey };
