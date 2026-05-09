"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, Badge, Button, StateBlock, Table } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { AddClientModal } from "./_components";
import type { CoachClientSummary } from "@regen/types";

const AVATAR_TONES = ["#FF5B5B", "#FFB547", "#7AB8FF", "var(--lime)", "#6EE7A8"];

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  return Math.floor((new Date().getTime() - new Date(iso).getTime()) / 86400000);
}

function clientStatus(c: CoachClientSummary): { label: string; tone: "success" | "warn" | "danger" } {
  const days = daysSince(c.lastSession?.performedAt ?? undefined);
  if (!c.assignment || c.assignment.status !== "active") return { label: "Sin plan", tone: "danger" };
  if (days === null || days > 7) return { label: "Inactiva", tone: "danger" };
  if (days > 3) return { label: "Atención", tone: "warn" };
  return { label: "On track", tone: "success" };
}

export default function AlumnosPage() {
  const { api, user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<CoachClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    api.get<CoachClientSummary[]>("/coach/clients")
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  const filtered = clients.filter(c => (c.name ?? c.email).toLowerCase().includes(search.toLowerCase()));

  const rows = filtered.map((c, i) => {
    const days = daysSince(c.lastSession?.performedAt ?? undefined);
    const { label, tone } = clientStatus(c);
    const name = c.name ?? c.email;
    return {
      name: (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={name} size={30} tone={AVATAR_TONES[i % AVATAR_TONES.length]} />
          <span style={{ fontWeight: 600 }}>{name}</span>
        </div>
      ),
      plan: c.assignment?.plan?.title ?? <span style={{ color: "var(--text-mute)" }}>—</span>,
      last: days !== null ? (
        <span className="ta-mono">{days === 0 ? "Hoy" : `Hace ${days}d`}</span>
      ) : (
        <span style={{ color: "var(--text-mute)" }}>Nunca</span>
      ),
      status: <Badge tone={tone}>{label}</Badge>,
    };
  });

  return (
    <>
      <DesktopShell
        active="athletes"
        title="Alumnos"
        subtitle={`${clients.length} en total`}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            <div className="coach-header-action-secondary" style={{ display: "flex", alignItems: "center", gap: 8, width: 240, height: 36, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" strokeWidth="1.8" strokeLinecap="round">
                <path d="M11 19a8 8 0 1 1 5.3-14 8 8 0 0 1-5.3 14zM21 21l-4.3-4.3" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" }} />
            </div>
            <Button icon="plus" onClick={() => setShowAdd(true)}>Agregar alumno</Button>
          </>
        }
      >
        <div className="coach-pad">
          <div className="coach-mobile-search" style={{ display: "none", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px", marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 19a8 8 0 1 1 5.3-14 8 8 0 0 1-5.3 14zM21 21l-4.3-4.3" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alumno…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }} />
          </div>

          {loading ? (
            <StateBlock kind="loading" title="Cargando alumnos…" />
          ) : filtered.length === 0 && !search ? (
            <StateBlock kind="empty" title="Sin alumnos" body='Agregá tu primer alumno con el botón "Agregar alumno".' />
          ) : filtered.length === 0 ? (
            <StateBlock kind="empty" title="Sin resultados" body="Ningún alumno coincide con tu búsqueda." />
          ) : (
            <Table
              cols={[
                { key: "name", label: "Alumno", w: "2.5fr" },
                { key: "plan", label: "Plan activo", w: "2.5fr" },
                { key: "last", label: "Última sesión", w: "1.2fr" },
                { key: "status", label: "", w: "1fr", align: "right" },
              ]}
              rows={rows}
              onRowClick={i => router.push(`/coach/alumnos/${filtered[i].id}`)}
            />
          )}
        </div>
      </DesktopShell>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={c => setClients(prev => [...prev, c])} />}
    </>
  );
}