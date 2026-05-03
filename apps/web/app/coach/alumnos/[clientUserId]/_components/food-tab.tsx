"use client";

import Image from "next/image";
import { Badge, Button, StateBlock } from "@/components/ui";
import type { FoodItem } from "./_types";

interface FoodTabProps {
  food: FoodItem[] | null;
  foodLoading: boolean;
  foodCommentDrafts: Record<string, string>;
  onDraftChange: (foodId: string, value: string) => void;
  onPostComment: (foodId: string) => void;
  onReload: () => void;
}

export function FoodTab({ food, foodLoading, foodCommentDrafts, onDraftChange, onPostComment, onReload }: FoodTabProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Comidas</div>
        <Button variant="ghost" size="sm" onClick={onReload}>Recargar</Button>
      </div>
      {foodLoading || food === null ? (
        <StateBlock kind="loading" title="Cargando comidas…" />
      ) : food.length === 0 ? (
        <StateBlock kind="empty" title="Sin comidas" body="El alumno aún no registró comidas." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {food.slice(0, 30).map((f) => (
            <div key={f.id} style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                  {new Date(f.loggedAt).toLocaleString("es", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {f.source && f.source !== "manual" ? <Badge tone="info">EXTERNAL</Badge> : <Badge tone="neutral">MANUAL</Badge>}
                  {f.photoUrl ? (
                    <a href={f.photoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--lime-high)", fontWeight: 700 }}>
                      Ver foto
                    </a>
                  ) : null}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "flex-start" }}>
                {f.photoUrl ? (
                  <Image
                    src={f.photoUrl}
                    alt=""
                    width={54}
                    height={54}
                    style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)" }}
                  />
                ) : null}
                {f.text ? (
                  <div style={{ fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap" }}>{f.text}</div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--text-mute)" }}>—</div>
                )}
              </div>

              {f.coachComments?.length ? (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
                    Comentarios
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {f.coachComments.slice(0, 3).map((c) => (
                      <div key={c.id} style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{c.coach.name ?? "Coach"}</div>
                        <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2, whiteSpace: "pre-wrap" }}>{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <input
                  value={foodCommentDrafts[f.id] ?? ""}
                  onChange={(e) => onDraftChange(f.id, e.target.value)}
                  placeholder="Comentario del coach…"
                  style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }}
                />
                <Button
                  size="sm"
                  icon="send"
                  disabled={!String(foodCommentDrafts[f.id] ?? "").trim()}
                  onClick={() => onPostComment(f.id)}
                >
                  Enviar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
