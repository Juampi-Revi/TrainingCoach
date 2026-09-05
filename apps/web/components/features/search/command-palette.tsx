"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";
import type { GlobalSearchHit, GlobalSearchKind, GlobalSearchResponse } from "@regen/types";
import "./command-palette.css";

const KIND_META: Record<GlobalSearchKind, { label: string; icon: IconName }> = {
  client: { label: "Alumnos", icon: "users" },
  plan: { label: "Planes", icon: "book" },
  workout: { label: "Entrenamientos", icon: "dumbbell" },
  exercise: { label: "Ejercicios", icon: "star" },
};

const EMPTY: GlobalSearchResponse = { clients: [], plans: [], workouts: [], exercises: [] };

function flatten(data: GlobalSearchResponse): GlobalSearchHit[] {
  return [...data.clients, ...data.plans, ...data.workouts, ...data.exercises];
}

export function CommandPalette() {
  const { api } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<GlobalSearchResponse>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  const items = useMemo(() => flatten(data), [data]);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setData(EMPTY);
    setActive(0);
  }, []);

  const go = useCallback((hit: GlobalSearchHit) => {
    close();
    router.push(hit.href);
  }, [close, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 1) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => {
      api
        .get<GlobalSearchResponse>(`/coach/search?q=${encodeURIComponent(query)}`)
        .then((res) => {
          setData(res);
          setActive(0);
        })
        .catch(() => setData(EMPTY))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(t);
  }, [api, open, q]);

  if (!open) return null;

  const groups = (["client", "plan", "workout", "exercise"] as const)
    .map((kind) => ({ kind, hits: data[kind === "client" ? "clients" : kind === "plan" ? "plans" : kind === "workout" ? "workouts" : "exercises"] }))
    .filter((g) => g.hits.length > 0);

  return (
    <div className="cmdk-backdrop" onClick={close} role="presentation">
      <div
        className="cmdk-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); close(); }
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(items.length - 1, i + 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
          if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]!); }
        }}
      >
        <div className="cmdk-input-row">
          <Icon name="search" size={16} color="var(--text-mute)" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar alumnos, planes, workouts…"
            aria-label="Buscar"
          />
          <kbd className="cmdk-kbd">esc</kbd>
        </div>

        <div className="cmdk-results" role="listbox">
          {q.trim().length === 0 && (
            <div className="cmdk-empty">Escribí para buscar en tu catálogo</div>
          )}
          {q.trim().length > 0 && loading && items.length === 0 && (
            <div className="cmdk-empty">Buscando…</div>
          )}
          {q.trim().length > 0 && !loading && items.length === 0 && (
            <div className="cmdk-empty">Sin resultados</div>
          )}
          {groups.map((g) => {
            const meta = KIND_META[g.kind];
            return (
              <div key={g.kind} className="cmdk-group">
                <div className="cmdk-group-label">{meta.label}</div>
                {g.hits.map((hit) => {
                  const idx = items.findIndex((x) => x.id === hit.id && x.kind === hit.kind);
                  const selected = idx === active;
                  return (
                    <button
                      key={`${hit.kind}-${hit.id}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`cmdk-item${selected ? " is-active" : ""}`}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(hit)}
                    >
                      <Icon name={meta.icon} size={15} />
                      <span className="cmdk-item-title">{hit.title}</span>
                      {hit.subtitle && <span className="cmdk-item-sub">{hit.subtitle}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
