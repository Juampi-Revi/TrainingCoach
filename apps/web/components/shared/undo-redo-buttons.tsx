"use client";

import { Button } from "@/components/ui";

export function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  busy = false,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  busy?: boolean;
}) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon="history"
        disabled={!canUndo || busy}
        onClick={onUndo}
        title="Deshacer (⌘Z)"
      >
        Deshacer
      </Button>
      <Button
        variant="outline"
        size="sm"
        icon="repeat"
        disabled={!canRedo || busy}
        onClick={onRedo}
        title="Rehacer (⌘⇧Z)"
      >
        Rehacer
      </Button>
    </>
  );
}
