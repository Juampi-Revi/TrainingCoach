const MAX_BYTES = 800_000;
const ALLOWED = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/x-m4a",
  "audio/m4a",
]);

export type TurnAudio = {
  mediaType: string;
  data: string;
};

export async function transcribeAudio(apiKey: string, audio: TurnAudio): Promise<string | null> {
  const mediaType = audio.mediaType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED.has(mediaType)) return null;
  let bytes: Buffer;
  try {
    bytes = Buffer.from(audio.data, "base64");
  } catch {
    return null;
  }
  if (bytes.length < 64 || bytes.length > MAX_BYTES) return null;

  const form = new FormData();
  form.append("file", new File([new Uint8Array(bytes)], fileName(mediaType), { type: mediaType }));
  form.append("model", "whisper-1");
  form.append("language", "es");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const body = (await response.json().catch(() => null)) as { text?: unknown; error?: { message?: string } } | null;
  if (!response.ok) {
    throw new Error(body?.error?.message ?? `whisper_${response.status}`);
  }
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  return text || null;
}

function fileName(mediaType: string): string {
  if (mediaType.includes("mp4") || mediaType.includes("m4a")) return "audio.m4a";
  if (mediaType.includes("mpeg") || mediaType.includes("mp3")) return "audio.mp3";
  if (mediaType.includes("ogg")) return "audio.ogg";
  if (mediaType.includes("wav")) return "audio.wav";
  return "audio.webm";
}
