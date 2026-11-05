"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui";

export function CameraCapture({
  onCapture,
  onClose,
  onUnavailable,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shooting, setShooting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let closed = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("No pude abrir la cámara. Podés usar la del teléfono.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        });
        if (closed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);
      } catch {
        setError("No pude abrir la cámara. Podés usar la del teléfono.");
      }
    }

    void start();
    return () => {
      closed = true;
      stop();
    };
  }, [mounted, stop]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  async function shoot() {
    const video = videoRef.current;
    if (!video || video.videoWidth < 8 || shooting) return;
    setShooting(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No pude sacar la foto.");
      context.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) throw new Error("No pude sacar la foto.");
      stop();
      onCapture(new File([blob], "plato.jpg", { type: "image/jpeg" }));
    } catch {
      setError("No pude sacar la foto. Probá de nuevo.");
      setShooting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="asistente-camera" role="dialog" aria-modal="true" aria-label="Sacar foto del plato">
      {error ? (
        <div className="asistente-camera-error">
          <p>{error}</p>
          <button type="button" className="asistente-camera-fallback" onClick={onUnavailable}>
            Usar cámara del teléfono
          </button>
          <button type="button" className="asistente-camera-text" onClick={onClose}>
            Cancelar
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="asistente-camera-video"
            playsInline
            autoPlay
            muted
            onLoadedMetadata={() => setReady(true)}
          />
          <p className="asistente-camera-hint">Enfocá el plato</p>
          <div className="asistente-camera-bar">
            <button type="button" className="asistente-camera-close" onClick={onClose} aria-label="Cerrar cámara">
              <Icon name="x" size={18} />
            </button>
            <button
              type="button"
              className="asistente-camera-shutter"
              onClick={() => { void shoot(); }}
              disabled={!ready || shooting}
              aria-label="Disparar"
            />
            <span className="asistente-camera-spacer" aria-hidden />
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
