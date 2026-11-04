import { runtimeEnv } from "./runtime-env";

const HARDCODED_BETA_EMAILS = [
  "client@example.com",
  "alumno2@example.com",
  "alumno3@example.com",
  "alumno4@example.com",
  "alumno5@example.com",
];

export function assistantBetaEmails(): string[] {
  const fromEnv = runtimeEnv("ASSISTANT_BETA_EMAILS")
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
  return [...new Set([...HARDCODED_BETA_EMAILS, ...fromEnv])];
}

export function isAssistantBetaEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (runtimeEnv("NODE_ENV") !== "production") return true;
  return assistantBetaEmails().includes(email.toLowerCase());
}
