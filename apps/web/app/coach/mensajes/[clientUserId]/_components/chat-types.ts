export type RefPayload = {
  kind: "session" | "workoutTemplate";
  id: string;
  label?: string;
};

export type ChatMessageItem = {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; role: string };
  reference: RefPayload | null;
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
