import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export interface NotificationSettingsData {
  workoutReminder?: boolean;
  reminderTime?: string;
  reminderDays?: string[];
  inactivityAlert?: boolean;
  inactivityDays?: number;
  weeklySummary?: boolean;
  weeklySummaryDay?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export function getNotificationSettings(userId: string) {
  return prisma.notificationSettings.findUnique({ where: { userId } });
}

export async function upsertNotificationSettings(userId: string, data: NotificationSettingsData) {
  return prisma.notificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      workoutReminder: data.workoutReminder ?? false,
      reminderTime: data.reminderTime ?? "09:00",
      reminderDays: data.reminderDays ?? ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
      inactivityAlert: data.inactivityAlert ?? false,
      inactivityDays: data.inactivityDays ?? 3,
      weeklySummary: data.weeklySummary ?? false,
      weeklySummaryDay: data.weeklySummaryDay ?? "sunday",
      emailNotifications: data.emailNotifications ?? false,
      pushNotifications: data.pushNotifications ?? false,
    },
    update: data,
  });
}

export async function checkInactivityAndNotify(userId: string) {
  const settings = await getNotificationSettings(userId);
  if (!settings?.inactivityAlert) return;

  const days = settings.inactivityDays ?? 3;
  const lastSession = await prisma.workoutSession.findFirst({
    where: { clientUserId: userId, status: "completed" },
    orderBy: { performedAt: "desc" },
    select: { performedAt: true },
  });

  if (!lastSession) return;

  const daysSinceLastSession = Math.floor(
    (Date.now() - lastSession.performedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastSession >= days) {
    const coachLink = await prisma.coachClient.findFirst({
      where: { clientUserId: userId, status: "active" },
      select: { coachUserId: true },
    });

    notify({
      userId,
      type: "inactivity_alert",
      title: "Hace tiempo que no entrenás",
      body: `Hace ${daysSinceLastSession} días que no completás un entrenamiento. ¿Arrancamos hoy?`,
      linkUrl: "/semana",
    });

    if (coachLink) {
      notify({
        userId: coachLink.coachUserId,
        type: "client_inactive",
        title: "Alumno inactivo",
        body: `Tu alumno no entrena hace ${daysSinceLastSession} días`,
        linkUrl: `/coach/alumnos/${userId}`,
      });
    }
  }
}

export async function shouldSendWeeklySummary(userId: string): Promise<boolean> {
  const settings = await getNotificationSettings(userId);
  if (!settings?.weeklySummary) return false;

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  return today === settings.weeklySummaryDay;
}

export function formatTimeForUser(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export const DAY_NAMES: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export function getActiveDays(settings: { reminderDays?: string[] }): string[] {
  return (settings.reminderDays ?? []).map(d => DAY_NAMES[d] ?? d);
}
