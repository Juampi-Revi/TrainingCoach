import { prisma } from "./prisma";

export async function notify(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
}) {
  try {
    await prisma.notification.create({ data: params });
  } catch {
    // Notifications are non-critical — never crash the main request
  }
}
