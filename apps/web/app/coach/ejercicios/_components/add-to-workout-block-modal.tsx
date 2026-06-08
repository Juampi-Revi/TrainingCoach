"use client";

import { Modal } from "@/components/shared/modal/modal";
import { Button } from "@/components/ui";
import type { WorkoutTemplateDetail } from "@regen/types";

const BLOCK_TYPE_LABEL: Record<string, string> = {
  warmup: "Warmup",
  strength: "Fuerza",
  intervals: "Intervalos",
  cardio: "Cardio",
  cooldown: "Cooldown",
};

export function AddToWorkoutBlockModal({
  open,
  title,
  blocks,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  blocks: WorkoutTemplateDetail["blocks"];
  onClose: () => void;
  onSelect: (blockId: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title ? `Elegí bloque · ${title}` : "Elegí bloque"} maxWidth={520}>
      <div style={{ display: "grid", gap: 10 }}>
        {blocks.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-mute)", lineHeight: 1.4 }}>
            Este entreno todavía no tiene bloques. Creá al menos un bloque y volvé a intentar.
          </div>
        ) : (
          blocks.map((b) => (
            <Button
              key={b.id}
              variant="outline"
              onClick={() => onSelect(b.id)}
              style={{ justifyContent: "space-between" }}
            >
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>{BLOCK_TYPE_LABEL[b.type] ?? b.type}</span>
                <span style={{ color: "var(--text-mute)" }}>{b.label ? `· ${b.label}` : ""}</span>
              </span>
              <span style={{ fontSize: 12, color: "var(--text-mute)" }}>
                {b.exerciseCount ?? 0} ej
              </span>
            </Button>
          ))
        )}
      </div>
    </Modal>
  );
}
