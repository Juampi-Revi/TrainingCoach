export type RefPayload = {
  kind: "session" | "workoutTemplate";
  id: string;
  label?: string;
};

export type ChatMedia = {
  type: "image" | "video";
  url: string;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  durationSeconds?: number | null;
};

export type UploadedChatMedia = {
  kind: "image" | "video";
  url: string;
  publicId: string;
  bytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

export type ChatMessageItem = {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; role: string };
  reference: RefPayload | null;
  media?: ChatMedia | null;
};

export type ChatResponse = {
  thread: { id: string };
  client: { id: string; name: string };
  messages: ChatMessageItem[];
};

export type ClientDetailResponse = {
  client: { id: string; email: string; name: string | null };
  recentSessions: Array<{
    id: string;
    performedAt: string;
    workoutTemplate: { id: string; title: string } | null;
  }>;
};
