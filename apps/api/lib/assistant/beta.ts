import { runtimeEnv } from "./runtime-env";
import { getAssistantSetting } from "./settings.service";

const HARDCODED_BETA_EMAILS = [
  "client@example.com",
  "alumno2@example.com",
  "alumno3@example.com",
  "alumno4@example.com",
  "alumno5@example.com",
];

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((value) =>
      value
        .trim()
        .replace(/^['"]|['"]$/g, "")
        .replace(/^assistant_beta_emails\s*=\s*/i, "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

export async function assistantBetaEmails(): Promise<string[]> {
  const fromSetting = parseEmails(await getAssistantSetting("ASSISTANT_BETA_EMAILS"));
  return [...new Set([...HARDCODED_BETA_EMAILS, ...fromSetting])];
}

export async function isAssistantBetaEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  if (runtimeEnv("NODE_ENV") !== "production") return true;
  return (await assistantBetaEmails()).includes(email.toLowerCase());
}

export async function resolveAssistantBeta(user: {
  email: string;
  assistantBeta: boolean;
}): Promise<boolean> {
  if (user.assistantBeta) return true;
  return isAssistantBetaEmail(user.email);
}
