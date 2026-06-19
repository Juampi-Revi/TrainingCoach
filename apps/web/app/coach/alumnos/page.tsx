"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { AddClientModal } from "./_components";
import { ClientCard, clientStatus } from "./_components/client-card";
import type { CoachClientSummary } from "@regen/types";

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? clients.filter((c) => (c.name ?? c.email).toLowerCase().includes(q)) : clients;
    const priority = (c: CoachClientSummary) => {
      const { tone } = clientStatus(c);
      if (tone === "danger") return 0;
      if (tone === "warn") return 1;
      return 2;
    };
    return [...base].sort((a, b) => {
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      const an = (a.name ?? a.email).toLowerCase();
      const bn = (b.name ?? b.email).toLowerCase();
      return an.localeCompare(bn);
    });
  }, [clients, search]);

  const handleClientAction = (action: string, client: CoachClientSummary) => {
    if (action === "Asignar plan") {
      router.push(`/coach/alumnos/${client.id}?tab=plan`);
    } else if (action === "Enviar mensaje") {
      router.push(`/coach/mensajes?client=${client.id}`);
    } else if (action === "Revisar log") {
      router.push(`/coach/alumnos/${client.id}?tab=log`);
    } else if (action === "Ver progreso") {
      router.push(`/coach/alumnos/${client.id}?tab=progress`);
    } else if (action === "Ajustar plan") {
      router.push(`/coach/alumnos/${client.id}?tab=plan`);
    }
  };

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
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)" }} />
            </div>
            <Button variant="outline" icon="history" onClick={() => router.push("/coach/calendario")}>
              Agenda
            </Button>
            <Button variant="outline" icon="users" onClick={() => router.push("/coach/alumnos/grupos")}>
              Grupos
            </Button>
            <Button icon="plus" onClick={() => setShowAdd(true)}>Agregar alumno</Button>
          </>
        }
      >
        <div className="coach-pad">
          <div className="coach-mobile-search" style={{ display: "none", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px", marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-mute)" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 19a8 8 0 1 1 5.3-14 8 8 0 0 1-5.3 14zM21 21l-4.3-4.3" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar alumno…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }} />
          </div>

          {loading ? (
            <StateBlock kind="loading" title="Cargando alumnos…" />
          ) : filtered.length === 0 && !search ? (
            <StateBlock kind="empty" title="Sin alumnos" body='Agregá tu primer alumno con el botón "Agregar alumno".' />
          ) : filtered.length === 0 ? (
            <StateBlock kind="empty" title="Sin resultados" body="Ningún alumno coincide con tu búsqueda." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {filtered.map((c, i) => (
                <ClientCard
                  key={c.id}
                  client={c}
                  index={i}
                  onAction={handleClientAction}
                />
              ))}
            </div>
          )}
        </div>
      </DesktopShell>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={c => setClients(prev => [...prev, c])} />}
    </>
  );
}
