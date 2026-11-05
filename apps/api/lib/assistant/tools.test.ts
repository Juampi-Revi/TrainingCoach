import { describe, expect, it } from "vitest";
import { searchFoodsInput, searchQueriesFrom } from "./tools";

describe("searchQueriesFrom", () => {
  it("keeps every distinct food in one list", () => {
    expect(searchQueriesFrom({
      queries: ["papa", "zanahoria", "pechuga", "pimiento verde", "cebolla"],
    })).toEqual(["papa", "zanahoria", "pechuga", "pimiento verde", "cebolla"]);
  });

  it("accepts the old single query shape", () => {
    expect(searchQueriesFrom({ query: "papa" })).toEqual(["papa"]);
  });

  it("dedupes and caps at 8", () => {
    expect(searchQueriesFrom({
      queries: ["Papa", "papa", "a", "b", "c", "d", "e", "f", "g", "h"],
    })).toEqual(["Papa", "a", "b", "c", "d", "e", "f", "g"]);
  });
});

describe("searchFoodsInput", () => {
  it("rejects a single query field", () => {
    expect(searchFoodsInput.safeParse({ query: "papa" }).success).toBe(false);
    expect(searchFoodsInput.safeParse({ queries: ["papa", "zanahoria"] }).success).toBe(true);
  });
});
