"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { useToast } from "@/lib/toast";
import { shrinkPhoto } from "../_lib/photo";
import { useVoiceRecorder, type AssistantAudio } from "../_hooks/use-voice-recorder";

export type AssistantPhoto = { mediaType: "image/jpeg"; data: string };

export function Composer({
  busy,
  onSend,
}: {
  busy: boolean;
  onSend: (text: string, photo?: AssistantPhoto, audio?: AssistantAudio) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<AssistantPhoto | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const voice = useVoiceRecorder();
  const ready = text.trim() !== "" || photo !== null || voice.recording;

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
  }

  function submit(audio?: AssistantAudio) {
    const value = text.trim();
    if ((!value && !photo && !audio) || busy) return;
    onSend(value, photo ?? undefined, audio);
    setText("");
    clearPhoto();
  }

  async function pickPhoto(file: File) {
    try {
      const data = await shrinkPhoto(file);
      setPhoto({ mediaType: "image/jpeg", data });
      setPreview(`data:image/jpeg;base64,${data}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No pude leer esa foto");
    }
  }

  async function toggleVoice() {
    if (busy) return;
    if (voice.recording) {
      try {
        const audio = await voice.stop();
        if (audio) submit(audio);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "No pude mandar el audio");
      }
      return;
    }
    try {
      await voice.start();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No pude grabar");
    }
  }

  return (
    <div className="asistente-composer-wrap">
      {preview ? (
        <div className="asistente-photo-preview">
          <img src={preview} alt="Foto lista para enviar" />
          <button type="button" onClick={clearPhoto} aria-label="Sacar la foto" disabled={busy}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ) : null}
      <form
        className="asistente-composer"
        onSubmit={(event) => {
          event.preventDefault();
          if (voice.recording) {
            void toggleVoice();
            return;
          }
          submit();
        }}
      >
        <input
          ref={fileRef}
          className="asistente-photo-file"
          type="file"
          accept="image/*"
          aria-label="Archivo de la foto"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void pickPhoto(file);
          }}
        />
        <button
          type="button"
          className="asistente-photo"
          disabled={busy || voice.recording}
          aria-label="Adjuntar una foto del plato"
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="image" size={18} />
        </button>
        <button
          type="button"
          className={`asistente-mic${voice.recording ? " recording" : ""}`}
          disabled={busy}
          aria-label={voice.recording ? "Detener y enviar el audio" : "Grabar un audio"}
          onClick={() => { void toggleVoice(); }}
        >
          <Icon name="mic" size={18} />
        </button>
        {voice.recording ? (
          <span className="asistente-mic-timer" aria-live="polite">
            {voice.seconds}s
          </span>
        ) : (
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={photo ? "Sumá un detalle…" : "Comí, tomé, una foto o un audio"}
            maxLength={2000}
            disabled={busy}
            aria-label="Mensaje al asistente"
          />
        )}
        <button
          type="submit"
          className="asistente-send"
          disabled={busy || !ready}
          aria-label={voice.recording ? "Enviar audio" : "Enviar"}
        >
          <Icon name="send" size={16} />
        </button>
      </form>
    </div>
  );
}
