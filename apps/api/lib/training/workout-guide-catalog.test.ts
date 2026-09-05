import { describe, expect, it } from "vitest";
import {
  buildGuideCatalogRows,
  mapGuideEquipment,
  mapGuideMuscle,
  mapGuideObjective,
  WORKOUT_GUIDE_SOURCE,
} from "./workout-guide-catalog";

describe("workout-guide-catalog", () => {
  it("maps muscles and equipment to regen values", () => {
    expect(mapGuideMuscle("Chest")).toBe("chest");
    expect(mapGuideMuscle("Hamstrings")).toBe("legs");
    expect(mapGuideEquipment("Barbell")).toBe("Barra");
    expect(mapGuideEquipment("Cable")).toBe("Polea");
  });

  it("maps stretch exercises to mobility", () => {
    expect(mapGuideObjective("bodyweight_reps", true)).toBe("mobility");
    expect(mapGuideObjective("duration", false)).toBe("conditioning");
  });

  it("builds 302 idempotent catalog rows", () => {
    const rows = buildGuideCatalogRows();
    expect(rows).toHaveLength(302);
    expect(rows.every((row) => row.source === WORKOUT_GUIDE_SOURCE)).toBe(true);
    expect(new Set(rows.map((row) => row.sourceId)).size).toBe(302);
  });
});
