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

type WeeklySummaryData = {
  workoutsCompleted: number;
  totalVolume: number;
  prsCount: number;
  topMuscles: Array<{ muscle: string; sets: number }>;
  avgEnergy: number | null;
  streakDays: number;
};

type SendWeeklySummaryParams = {
  to: string;
  clientName: string;
  weekStart: string;
  weekEnd: string;
  data: WeeklySummaryData;
  appUrl: string;
};

export async function sendWeeklySummaryEmail({
  to,
  clientName,
  weekStart,
  weekEnd,
  data,
  appUrl,
}: SendWeeklySummaryParams) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: false };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const topMusclesList = data.topMuscles.slice(0, 3).map(m => m.muscle).join(", ") || "Ninguno";
  const avgEnergyStr = data.avgEnergy !== null ? data.avgEnergy.toFixed(1) : "N/A";

  const subject = `Tu resumen semanal de entrenamiento — ${formatDate(weekStart)} al ${formatDate(weekEnd)}`;

  const text = [
    `Hola ${clientName},`,
    "",
    `Resumen de tu semana (${formatDate(weekStart)} - ${formatDate(weekEnd)}):`,
    "",
    `• Entrenamientos: ${data.workoutsCompleted}`,
    `• Volumen total: ${data.totalVolume.toLocaleString("es-AR")} kg`,
    `• Récords personales: ${data.prsCount}`,
    `• Músculos más trabajados: ${topMusclesList}`,
    `• Energía promedio: ${avgEnergyStr}/5`,
    `• Racha: ${data.streakDays} días`,
    "",
    "¡Arrancá la próxima semana con todo!",
    `${appUrl}/semana`,
  ].join("\n");

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; max-width: 480px; margin: 0 auto;">
      <div style="background: #D7FF3A; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #0B0B0C;">Tu Resumen Semanal</h1>
        <p style="margin: 8px 0 0; font-size: 14px; color: #4A5B00;">${formatDate(weekStart)} — ${formatDate(weekEnd)}</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px;">Hola <strong>${escapeHtml(clientName)}</strong>,</p>
        <p style="color: #6B6B72;">Esta semana lograste:</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;">
          <div style="background: #141417; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #D7FF3A; font-family: ui-monospace, monospace;">${data.workoutsCompleted}</div>
            <div style="font-size: 11px; color: #8D8D94; text-transform: uppercase; letter-spacing: 0.1em;">Entrenamientos</div>
          </div>
          <div style="background: #141417; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #D7FF3A; font-family: ui-monospace, monospace;">${(data.totalVolume / 1000).toFixed(1)}k</div>
            <div style="font-size: 11px; color: #8D8D94; text-transform: uppercase; letter-spacing: 0.1em;">kg levantados</div>
          </div>
          <div style="background: #141417; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #D7FF3A; font-family: ui-monospace, monospace;">${data.prsCount}</div>
            <div style="font-size: 11px; color: #8D8D94; text-transform: uppercase; letter-spacing: 0.1em;">PRs nuevos</div>
          </div>
          <div style="background: #141417; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #D7FF3A; font-family: ui-monospace, monospace;">${data.streakDays}</div>
            <div style="font-size: 11px; color: #8D8D94; text-transform: uppercase; letter-spacing: 0.1em;">días racha</div>
          </div>
        </div>

        <div style="background: #141417; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 11px; color: #8D8D94; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Músculos más trabajados</div>
          <div style="color: #F5F5F4;">${escapeHtml(topMusclesList)}</div>
        </div>

        <div style="background: #141417; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <div style="font-size: 11px; color: #8D8D94; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Energía promedio</div>
          <div style="color: #F5F5F4; font-size: 24px; font-weight: 600;">${avgEnergyStr} <span style="font-size: 14px; color: #8D8D94;">/ 5</span></div>
        </div>

        <a href="${appUrl}/semana" style="display: block; background: #D7FF3A; color: #0B0B0C; text-align: center; padding: 14px 24px; border-radius: 10px; font-weight: 700; text-decoration: none; margin-top: 20px;">
          Ver mi semana →
        </a>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  return { sent: res.ok };
}
