"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

function haversineMeters(a: GeolocationCoordinates, b: GeolocationCoordinates) {
  const R = 6371000;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function EnduranceManualLog({
  elapsedSeconds,
  onSave,
  saving,
}: {
  elapsedSeconds: number;
  onSave: (payload: { km: string; minutes: string; notes: string }) => void;
  saving: boolean;
}) {
  const [km, setKm] = useState("");
  const [minutes, setMinutes] = useState(elapsedSeconds > 0 ? String(Math.max(1, Math.round(elapsedSeconds / 60))) : "");
  const [notes, setNotes] = useState("");
  const [gpsOn, setGpsOn] = useState(false);
  const [gpsMeters, setGpsMeters] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const lastCoords = useRef<GeolocationCoordinates | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!gpsOn) {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    if (!("geolocation" in navigator)) {
      setGpsError("GPS no disponible en este dispositivo");
      setGpsOn(false);
      return;
    }
    lastCoords.current = null;
    setGpsMeters(0);
    setGpsError(null);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const prev = lastCoords.current;
        if (prev) {
          const d = haversineMeters(prev, pos.coords);
          if (d > 2 && d < 80) setGpsMeters((m) => m + d);
        }
        lastCoords.current = pos.coords;
      },
      () => setGpsError("No se pudo leer GPS. Revisá permisos."),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 12000 },
    );
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [gpsOn]);

  useEffect(() => {
    if (gpsMeters > 0) setKm((gpsMeters / 1000).toFixed(2));
  }, [gpsMeters]);

  return (
    <div
      style={{
        margin: "12px 16px 0",
        padding: 14,
        borderRadius: 12,
        border: "1px solid var(--line)",
        background: "var(--bg-1)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800 }}>Registro manual</div>
      <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 4, lineHeight: 1.4 }}>
        Si no tenés Strava, cargá distancia y tiempo acá. El GPS es opcional.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--text-mute)" }}>
          Distancia (km)
          <input
            inputMode="decimal"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            placeholder="5.0"
            style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 700 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--text-mute)" }}>
          Tiempo (min)
          <input
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="30"
            style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", fontFamily: "var(--font-mono)", fontWeight: 700 }}
          />
        </label>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Sensaciones, ritmo, clima…"
        rows={2}
        style={{ width: "100%", marginTop: 8, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: 10, color: "var(--text)", fontFamily: "var(--font-sans)", resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Button size="sm" variant={gpsOn ? "secondary" : "outline"} onClick={() => setGpsOn((v) => !v)}>
          {gpsOn ? "Detener GPS" : "GPS opcional"}
        </Button>
        {gpsOn && (
          <span className="ta-mono" style={{ fontSize: 11, color: "var(--lime)" }}>
            {(gpsMeters / 1000).toFixed(2)} km en vivo
          </span>
        )}
        {gpsError && <span style={{ fontSize: 12, color: "var(--danger)" }}>{gpsError}</span>}
        <div style={{ flex: 1 }} />
        <Button size="sm" disabled={saving} onClick={() => onSave({ km, minutes, notes })}>
          {saving ? "Guardando…" : "Guardar y completar"}
        </Button>
      </div>
    </div>
  );
}
