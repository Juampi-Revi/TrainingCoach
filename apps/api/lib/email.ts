type SendResetParams = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendResetEmail({ to, name, resetUrl }: SendResetParams) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: false };

  const subject = "Resetear contraseña — Training Challenge";
  const text = `Hola ${name},\n\nHacé clic en el siguiente link para resetear tu contraseña (válido por 1 hora):\n\n${resetUrl}\n\nSi no pediste este email, ignoralo.`;
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;">
      <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p>Hacé clic para resetear tu contraseña (válido por 1 hora):</p>
      <p><a href="${resetUrl}" style="background:#D7FF3A;color:#0B0B0C;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;">Resetear contraseña</a></p>
      <p style="color:#888;font-size:12px;">Si no pediste este email, ignoralo.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text, html }),
  });
  return { sent: res.ok };
}

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

type SendCommentParams = {
  to: string;
  clientName: string;
  coachName: string;
  sessionTitle: string;
  commentText: string;
  sessionUrl: string;
};

export async function sendCommentEmail({
  to,
  clientName,
  coachName,
  sessionTitle,
  commentText,
  sessionUrl,
}: SendCommentParams) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: false };

  const subject = `Nuevo comentario de ${coachName} en tu sesión`;

  const text = [
    `Hola ${clientName},`,
    "",
    `${coachName} dejó un comentario en tu sesión "${sessionTitle}":`,
    "",
    commentText,
    "",
    `Ver sesión: ${sessionUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
      <p>Hola <strong>${escapeHtml(clientName)}</strong>,</p>
      <p><strong>${escapeHtml(coachName)}</strong> dejó un comentario en tu sesión <strong>${escapeHtml(sessionTitle)}</strong>:</p>
      <blockquote style="border-left: 3px solid #6366f1; margin: 12px 0; padding: 8px 16px; color: #374151; background: #f9fafb;">
        ${escapeHtml(commentText).replaceAll("\n", "<br>")}
      </blockquote>
      <p><a href="${sessionUrl}">Ver sesión →</a></p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  return { sent: res.ok };
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
