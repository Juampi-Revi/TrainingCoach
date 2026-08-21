"use client";

import { useRouter } from "next/navigation";
import { Avatar, Badge, Icon } from "@/components/ui";
import type { CoachClientSummary } from "@regen/types";
import { AVATAR_TONES } from "@/lib/constants";

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  return Math.floor((new Date().getTime() - Date.parse(iso)) / 86400000);
}

export function clientStatus(c: CoachClientSummary): { label: string; tone: "success" | "warn" | "danger"; action: string } {
  const days = daysSince(c.lastSession?.performedAt ?? undefined);
  if (!c.assignment || c.assignment.status !== "active") return { label: "Sin plan", tone: "danger", action: "Asignar plan" };
  if (days === null || days > 7) return { label: "Inactiva", tone: "danger", action: "Enviar mensaje" };
  if (days > 3) return { label: "Atención", tone: "warn", action: "Revisar log" };
  return { label: "On track", tone: "success", action: "Ver progreso" };
}

interface ClientCardProps {
  client: CoachClientSummary;
  index: number;
  onAction: (action: string, client: CoachClientSummary) => void;
}

export function ClientCard({ client, index, onAction }: ClientCardProps) {
  const router = useRouter();
  const days = daysSince(client.lastSession?.performedAt ?? undefined);
  const { label, tone, action } = clientStatus(client);
  const name = client.name ?? client.email;
  const planTitle = client.assignment?.plan?.title ?? null;

  return (
    <div
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "border-color 0.15s",
      }}
    >
      {/* Header: avatar + name + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar name={name} size={36} tone={AVATAR_TONES[index % AVATAR_TONES.length]} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={() => router.push(`/coach/alumnos/${client.id}`)}
            style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--text)", textAlign: "left" }}
          >
            {name}
          </button>
          <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>
            {client.email}
          </div>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>

      {/* Plan + last session */}
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-mute)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="book" size={12} color="var(--text-mute)" />
          {planTitle ?? "Sin plan"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="calendar" size={12} color="var(--text-mute)" />
          {days !== null ? (days === 0 ? "Hoy" : `Hace ${days}d`) : "Nunca"}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
        <button
          style={{ flex: 1, fontSize: 12, padding: "6px 0", borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--bg-2)", color: "var(--text)", cursor: "pointer", fontWeight: 600 }}
          onClick={(e) => { e.stopPropagation(); onAction(action, client); }}
        >
          {action}
        </button>
        <button
          style={{ flex: 1, fontSize: 12, padding: "6px 0", borderRadius: 8, border: "1px solid transparent", background: "transparent", color: "var(--text-mute)", cursor: "pointer", fontWeight: 600 }}
          onClick={(e) => { e.stopPropagation(); onAction("Ajustar plan", client); }}
        >
          Ajustar plan
        </button>
      </div>
    </div>
  );
}