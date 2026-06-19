"use client";

import { BlockPreview } from "./block-preview";

import type { BlockType, IntervalType } from "@regen/types";

interface BlockModalPreviewProps {
  blockType: BlockType;
  intervalType: IntervalType | null;
  label: string;
  description: string;
  prepare: string;
  work: string;
  rest: string;
  rounds: string;
  setCount: string;
  setRestSeconds: string;
  total: string;
  targetMinutes: string;
  restBetweenExercises: string;
  restAfterSeconds: string;
}

export function BlockModalPreview(props: BlockModalPreviewProps) {
  return (
    <div style={{ borderLeft: "1px solid var(--line)", background: "var(--bg)", overflow: "auto", padding: 16 }}>
      <BlockPreview {...props} />
    </div>
  );
}
