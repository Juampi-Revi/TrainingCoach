import { describe, expect, it } from "vitest";
import { shouldRemindAt } from "./supplement-windows";

describe("supplement reminder windows", () => {
  it("reminds in the configured slot", () => {
    expect(shouldRemindAt("morning", 9)).toBe(true);
    expect(shouldRemindAt("with_breakfast", 10)).toBe(true);
    expect(shouldRemindAt("afternoon", 16)).toBe(true);
    expect(shouldRemindAt("with_dinner", 21)).toBe(true);
    expect(shouldRemindAt("night", 22)).toBe(true);
  });

  it("does not remind before the slot", () => {
    expect(shouldRemindAt("morning", 7)).toBe(false);
    expect(shouldRemindAt("afternoon", 10)).toBe(false);
    expect(shouldRemindAt("night", 18)).toBe(false);
  });

  it("catches up in the evening if it was still pending", () => {
    expect(shouldRemindAt("morning", 21)).toBe(true);
    expect(shouldRemindAt("afternoon", 21)).toBe(true);
    expect(shouldRemindAt("morning", 14)).toBe(false);
  });
});
