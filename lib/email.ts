type SendInviteParams = {
  to: string;
  coachName: string;
  appUrl: string;
  tempPassword: string | null;
};

export function getAppUrl() {
  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  if (nextAuthUrl) return nextAuthUrl.replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/+$/, "");

  const port = process.env.PORT?.trim();
  if (port) return `http://localhost:${port}`.replace(/\/+$/, "");

  return "http://localhost:3003";
}

export async function sendInviteEmail({ to, coachName, appUrl, tempPassword }: SendInviteParams) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: false };

  const loginUrl = `${appUrl.replace(/\/+$/, "")}/login`;
  const subject = "Invitación a Training Challenge";

  const lines = [
    `Te invitó ${coachName} a usar Training Challenge.`,
    "",
    `Ingresá en: ${loginUrl}`,
    tempPassword ? `Contraseña temporal: ${tempPassword}` : null,
    tempPassword ? "Después, cambiá tu contraseña en: Cuenta" : null,
  ].filter(Boolean) as string[];

  const text = lines.join("\n");
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
      <p>Te invitó <strong>${escapeHtml(coachName)}</strong> a usar Training Challenge.</p>
      <p>Ingresá en: <a href="${loginUrl}">${loginUrl}</a></p>
      ${tempPassword ? `<p>Contraseña temporal: <strong style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${escapeHtml(tempPassword)}</strong></p>` : ""}
      ${tempPassword ? `<p>Después, cambiá tu contraseña en <strong>Cuenta</strong>.</p>` : ""}
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  return { sent: res.ok };
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
