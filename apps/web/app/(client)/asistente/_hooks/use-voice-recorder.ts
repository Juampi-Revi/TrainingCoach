"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AssistantAudio = { mediaType: string; data: string };

const MIN_MS = 400;

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? "").split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("No pude leer el audio"));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current != null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => () => {
    clearTimers();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, [clearTimers]);

  const start = useCallback(async (): Promise<void> => {
    if (recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("Este dispositivo no puede grabar audio");
    }
    const mimeType = pickMime();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    chunksRef.current = [];
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.start(250);
    setRecording(true);
    setSeconds(0);
    timerRef.current = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
  }, [recording]);

  const stop = useCallback(async (): Promise<AssistantAudio | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      return null;
    }
    const elapsed = Date.now() - startedAtRef.current;
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.stop();
    });
    clearTimers();
    recorderRef.current = null;
    setRecording(false);
    setSeconds(0);
    if (elapsed < MIN_MS || blob.size < 64) return null;
    const mediaType = (blob.type || "audio/webm").split(";")[0] || "audio/webm";
    return { mediaType, data: await blobToBase64(blob) };
  }, [clearTimers]);

  return { recording, seconds, start, stop };
}
