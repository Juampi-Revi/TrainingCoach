import { prisma } from "@/lib/prisma";
import { runtimeEnv } from "./runtime-env";

export const ASSISTANT_SETTING_KEYS = [
  "ASSISTANT_BETA_EMAILS",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "MONTHLY_BUDGET_USD",
] as const;

export type AssistantSettingKey = (typeof ASSISTANT_SETTING_KEYS)[number];

export async function getAssistantSetting(key: AssistantSettingKey): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  const fromDb = row?.value.trim() ?? "";
  return fromDb || runtimeEnv(key);
}
