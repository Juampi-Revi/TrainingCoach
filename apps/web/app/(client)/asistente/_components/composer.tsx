"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { useToast } from "@/lib/toast";
import { shrinkPhoto } from "../_lib/photo";

export type AssistantPhoto = { mediaType: "image/jpeg"; data: string };

export function Composer({
  busy,
  onSend,
}: {
  busy: boolean;
  onSend: (text: string, photo?: AssistantPhoto) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<AssistantPhoto | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const ready = text.trim() !== "" || photo !== null;

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
  }

  function submit() {
    const value = text.trim();
    if ((!value && !photo) || busy) return;
    onSend(value, photo ?? undefined);
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
          disabled={busy}
          aria-label="Adjuntar una foto del plato"
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="image" size={18} />
        </button>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={photo ? "Sumá un detalle…" : "Comí, tomé… o una foto"}
          maxLength={2000}
          disabled={busy}
          aria-label="Mensaje al asistente"
        />
        <button
          type="submit"
          className="asistente-send"
          disabled={busy || !ready}
          aria-label="Enviar"
        >
          <Icon name="send" size={16} />
        </button>
      </form>
    </div>
  );
}
