"use client";

import { useEffect, useState } from "react";

interface BarcodeScannerProps {
  onDetect: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetect, onClose }: BarcodeScannerProps) {
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let closed = false;
    const video = document.getElementById("barcode-video") as HTMLVideoElement | null;
    const Detector = (window as Window & { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;

    async function start() {
      if (!video || !Detector) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        await video.play();
        const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
        const tick = async () => {
          if (closed) return;
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue;
            if (value) {
              onDetect(value);
              return;
            }
          } catch {
            /* keep scanning */
          }
          raf = window.requestAnimationFrame(() => { void tick(); });
        };
        void tick();
      } catch {
        setError("No se pudo abrir la cámara. Cargá el código a mano.");
      }
    }

    void start();
    return () => {
      closed = true;
      window.cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetect]);

  return (
    <div className="scan-overlay" role="dialog" aria-label="Escanear código de barras">
      <div className="scan-sheet">
        <div className="scan-handle" />
        <div className="scan-title">Código de barras</div>
        <video id="barcode-video" className="scan-video" playsInline muted />
        {error && <div className="scan-error">{error}</div>}
        <input
          className="scan-input"
          inputMode="numeric"
          placeholder="O escribí el código"
          value={manual}
          onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
        />
        <div className="scan-actions">
          <button type="button" className="scan-btn ghost" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="scan-btn"
            disabled={manual.length < 8}
            onClick={() => onDetect(manual)}
          >
            Buscar
          </button>
        </div>
      </div>
      <style jsx>{`
        .scan-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 80; display: flex; align-items: flex-end; }
        .scan-sheet { width: 100%; background: var(--bg-1); border-radius: 20px 20px 0 0; padding: 12px 16px calc(20px + env(safe-area-inset-bottom)); }
        .scan-handle { width: 40px; height: 4px; border-radius: 99px; background: var(--line-2); margin: 4px auto 12px; }
        .scan-title { font-size: 16px; font-weight: 800; margin-bottom: 10px; }
        .scan-video { width: 100%; height: 180px; object-fit: cover; border-radius: 12px; background: var(--bg-2); }
        .scan-error { font-size: 12px; color: var(--warn); margin-top: 8px; }
        .scan-input { width: 100%; margin-top: 10px; height: 44px; border-radius: 10px; border: 1px solid var(--line-2); background: var(--bg-2); color: var(--text); padding: 0 12px; font-size: 16px; }
        .scan-actions { display: flex; gap: 8px; margin-top: 12px; }
        .scan-btn { flex: 1; height: 44px; border-radius: 10px; border: none; background: var(--lime); color: var(--text-on-accent); font-weight: 700; }
        .scan-btn.ghost { background: var(--bg-2); color: var(--text); border: 1px solid var(--line-2); }
        .scan-btn:disabled { opacity: .5; }
      `}</style>
    </div>
  );
}
