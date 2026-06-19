"use client";

import { BlockModalFields } from "./block-modal-fields";
import type { BlockModalViewProps } from "./block-modal-view";

type BlockModalFormProps = Pick<
  BlockModalViewProps,
  | "blockType"
  | "intervalType"
  | "label"
  | "description"
  | "prepare"
  | "work"
  | "rest"
  | "rounds"
  | "setCount"
  | "setRestSeconds"
  | "intervalExerciseStrategy"
  | "total"
  | "targetMinutes"
  | "restBetweenExercises"
  | "targetZone"
  | "steps"
  | "restAfterSeconds"
  | "setLabel"
  | "setDescription"
  | "setPrepare"
  | "setWork"
  | "setRest"
  | "setRounds"
  | "setSetCount"
  | "setSetRestSeconds"
  | "setIntervalExerciseStrategy"
  | "setTotal"
  | "setTargetMinutes"
  | "setRestBetweenExercises"
  | "setTargetZone"
  | "setSteps"
  | "setRestAfterSeconds"
>;

export function BlockModalForm(props: BlockModalFormProps) {
  return (
    <div style={{ overflow: "auto" }}>
      <BlockModalFields {...props} />
    </div>
  );
}
