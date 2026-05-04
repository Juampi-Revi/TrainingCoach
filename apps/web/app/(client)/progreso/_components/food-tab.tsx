"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge, Button, StateBlock } from "@/components/ui";
import { FoodSkeleton } from "./food-skeleton";
import type { FoodEntry } from "./_types";

type Props = {
  food: FoodEntry[] | null;
  loadFood: () => void;
  loadSummary: () => void;
};

export function FoodTab({ food, loadFood, loadSummary }: Props) {
  const { api, token } = useAuth();
  const toast = useToast();

  const [foodAt, setFoodAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [foodText, setFoodText] = useState("");
  const [foodPhotoUrl, setFoodPhotoUrl] = useState("");
  const [foodPhotoFile, setFoodPhotoFile] = useState<File | null>(null);
  const [savingFood, setSavingFood] = useState(false);
  const [foodError, setFoodError] = useState<string | null>(null);

  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingFoodAt, setEditingFoodAt] = useState("");
  const [editingFoodText, setEditingFoodText] = useState("");
  const [editingFoodPhotoUrl, setEditingFoodPhotoUrl] = useState("");
  const [editingFoodPhotoFile, setEditingFoodPhotoFile] = useState<File | null>(null);
  const [savingFoodEdit, setSavingFoodEdit] = useState(false);

  async function uploadFoodPhoto(file: File): Promise<string> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/client/food/photo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; data?: { url?: string }; error?: string } | null;
    if (!res.ok || !json?.ok || !json.data?.url) {
      throw new Error(json?.error ?? "Error subiendo foto");
    }
    return json.data.url;
  }

  async function saveFoodEntry() {
    setSavingFood(true);
    setFoodError(null);
    try {
      const uploadedUrl = foodPhotoFile ? await uploadFoodPhoto(foodPhotoFile) : null;
      await api.post("/client/food", {
        loggedAt: foodAt ? new Date(foodAt).toISOString() : null,
        text: foodText ? foodText : null,
        photoUrl: uploadedUrl ?? (foodPhotoUrl ? foodPhotoUrl : null),
        mealType: null,
        quality: null,
        macroTags: [],
      });
      setFoodText("");
      setFoodPhotoUrl("");
      setFoodPhotoFile(null);
      loadFood();
      loadSummary();
      toast.success("Comida registrada");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al registrar";
      setFoodError(msg);
      toast.error(msg);
    } finally {
      setSavingFood(false);
    }
  }

  function startEditFood(f: FoodEntry) {
    setEditingFoodId(f.id);
    setEditingFoodAt(new Date(f.loggedAt).toISOString().slice(0, 16));
    setEditingFoodText(f.text ?? "");
    setEditingFoodPhotoUrl(f.photoUrl ?? "");
    setEditingFoodPhotoFile(null);
  }

  function cancelEditFood() {
    setEditingFoodId(null);
    setEditingFoodAt("");
    setEditingFoodText("");
    setEditingFoodPhotoUrl("");
    setEditingFoodPhotoFile(null);
  }

  async function saveFoodEdit() {
    if (!editingFoodId) return;
    setSavingFoodEdit(true);
    try {
      const uploadedUrl = editingFoodPhotoFile ? await uploadFoodPhoto(editingFoodPhotoFile) : null;
      await api.patch(`/client/food/${editingFoodId}`, {
        loggedAt: editingFoodAt ? new Date(editingFoodAt).toISOString() : undefined,
        text: editingFoodText,
        photoUrl: uploadedUrl ?? editingFoodPhotoUrl,
      });
      cancelEditFood();
      loadFood();
      loadSummary();
      toast.success("Comida actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setSavingFoodEdit(false);
    }
  }

  async function deleteFoodEntry(foodId: string) {
    try {
      await api.del(`/client/food/${foodId}`);
      if (editingFoodId === foodId) cancelEditFood();
      loadFood();
      loadSummary();
      toast.success("Comida eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  const inputStyle = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text)", outline: "none" } as const;
  const labelStyle = { fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase" as const, letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 };

  return (
    <>
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Registrar comida</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={labelStyle}>Fecha y hora</div>
              <input type="datetime-local" value={foodAt} onChange={(e) => setFoodAt(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={labelStyle}>Qué comiste</div>
              <textarea value={foodText} onChange={(e) => setFoodText(e.target.value)} rows={3} placeholder="Ej: desayuno: café + 2 tostadas + fruta…" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={labelStyle}>Foto</div>
              <input type="file" accept="image/*" onChange={(e) => setFoodPhotoFile(e.target.files?.[0] ?? null)} style={{ width: "100%", background: "transparent", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={labelStyle}>Foto (URL opcional)</div>
              <input value={foodPhotoUrl} onChange={(e) => setFoodPhotoUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
            </div>
          </div>

          {foodError ? <div style={{ marginTop: 10, fontSize: 12, color: "var(--danger)" }}>{foodError}</div> : null}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <Button disabled={savingFood || !foodText.trim()} onClick={saveFoodEntry}>
              {savingFood ? "Guardando…" : "Registrar"}
            </Button>
          </div>
        </div>
      </div>

      {food === null ? (
        <FoodSkeleton />
      ) : (
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, marginBottom: 10 }}>
            Historial
          </div>
          {food.length === 0 ? (
            <StateBlock kind="empty" title="Sin comidas" body="Registrá tu primera comida para empezar." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {food.slice(0, 30).map((f) => (
                <div key={f.id} style={{ padding: "12px 12px", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <div className="ta-mono" style={{ fontSize: 12, color: "var(--text-mute)" }}>
                      {new Date(f.loggedAt).toLocaleString("es", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button size="sm" variant="ghost" icon="edit" onClick={() => startEditFood(f)}>Editar</Button>
                      <Button size="sm" variant="ghost" icon="trash" onClick={() => deleteFoodEntry(f.id)}>Borrar</Button>
                    </div>
                  </div>

                  {editingFoodId === f.id ? (
                    <div style={{ marginTop: 10, padding: 10, border: "1px solid var(--line)", borderRadius: 12, background: "var(--bg)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={labelStyle}>Fecha y hora</div>
                          <input type="datetime-local" value={editingFoodAt} onChange={(e) => setEditingFoodAt(e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={labelStyle}>Texto</div>
                          <textarea value={editingFoodText} onChange={(e) => setEditingFoodText(e.target.value)} rows={3} style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={labelStyle}>Foto</div>
                          <input type="file" accept="image/*" onChange={(e) => setEditingFoodPhotoFile(e.target.files?.[0] ?? null)} style={{ width: "100%", background: "transparent", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none" }} />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div style={labelStyle}>Foto (URL)</div>
                          <input value={editingFoodPhotoUrl} onChange={(e) => setEditingFoodPhotoUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                        <Button size="sm" variant="secondary" onClick={cancelEditFood}>Cancelar</Button>
                        <Button size="sm" disabled={savingFoodEdit} icon="check" onClick={saveFoodEdit}>
                          {savingFoodEdit ? "Guardando…" : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        {f.source && f.source !== "manual" ? <Badge tone="info">EXTERNAL</Badge> : <Badge tone="neutral">MANUAL</Badge>}
                        {f.coachComments?.length ? <Badge tone="limeSoft" icon="msg">{String(f.coachComments.length)}</Badge> : null}
                      </div>
                      {f.text ? (
                        <div style={{ fontSize: 13, color: "var(--text)", marginTop: 6, whiteSpace: "pre-wrap" }}>{f.text}</div>
                      ) : null}
                      {f.photoUrl ? (
                        <a href={f.photoUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", fontSize: 12, marginTop: 8, color: "var(--lime-high)" }}>
                          Ver foto
                        </a>
                      ) : null}
                    </>
                  )}

                  {f.coachComments?.length ? (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                      <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
                        Comentarios del coach
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
