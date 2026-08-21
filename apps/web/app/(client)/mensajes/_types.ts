export type RefKind = "session" | "workoutTemplate";

export interface RefPayload {
  kind: RefKind;
  id: string;
  label?: string;
}

export interface ChatMessageItem {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; role: string };
  reference?: RefPayload | null;
}

export interface ChatData {
  coach: { id: string; name: string };
  messages: ChatMessageItem[];
}

export interface SessionOption {
  id: string;
  performedAt: string;
  workoutTemplate: { id: string; title: string } | null;
}
