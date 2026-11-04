const HARDCODED_BETA_EMAILS = [
  "client@example.com",
  "alumno2@example.com",
  "alumno3@example.com",
  "alumno4@example.com",
  "alumno5@example.com",
];

export function assistantBetaEmails(): string[] {
  const fromEnv = (process.env.ASSISTANT_BETA_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().replace(/^['"]|['"]$/g, "").trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...HARDCODED_BETA_EMAILS, ...fromEnv])];
}

export function isAssistantBetaEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return assistantBetaEmails().includes(email.toLowerCase());
}
