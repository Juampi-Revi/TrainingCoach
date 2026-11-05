import { describe, expect, it } from "vitest";
import { GPT_6_LUNA_STANDARD } from "./cost";
import { runTurn, type LanguageModel, type ToolRegistry } from "./run-turn";
import { toolNames } from "./tools";

const emptyUsage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };

function stubRegistry(search: ToolRegistry["search_foods"]): ToolRegistry {
  const handlers = {} as ToolRegistry;
  for (const name of toolNames) {
    handlers[name] = async () => ({ stub: name });
  }
  handlers.search_foods = search;
  return handlers;
}

describe("runTurn search_foods", () => {
  it("batches parallel one-food searches into a single handler call", async () => {
    const searches: unknown[] = [];
    const model: LanguageModel = {
      async complete(request) {
        const last = request.messages.at(-1);
        if (last && last.role === "tool") {
          return { type: "message", text: "listo", usage: emptyUsage };
        }
        return {
          type: "tool_calls",
          usage: emptyUsage,
          calls: [
            { callId: "1", name: "search_foods", arguments: { query: "papa" } },
            { callId: "2", name: "search_foods", arguments: { query: "zanahoria" } },
            { callId: "3", name: "search_foods", arguments: { query: "pechuga" } },
          ],
        };
      },
    };

    const result = await runTurn({
      userId: "user",
      spentMicroUsd: 0,
      limitMicroUsd: 20_000_000,
      rates: GPT_6_LUNA_STANDARD,
      registry: stubRegistry(async (args) => {
        searches.push(args);
        return { matches: [] };
      }),
      model,
      systemPrompt: "test",
    }, "comí papa, zanahoria y pechuga");

    expect(searches).toEqual([{ queries: ["papa", "zanahoria", "pechuga"] }]);
    expect(result.kind).toBe("message");
    expect(result.traces.filter((trace) => trace.name === "search_foods")).toHaveLength(1);
  });

  it("accepts a single queries array", async () => {
    const searches: unknown[] = [];
    const model: LanguageModel = {
      async complete(request) {
        const last = request.messages.at(-1);
        if (last && last.role === "tool") {
          return { type: "message", text: "listo", usage: emptyUsage };
        }
        return {
          type: "tool_calls",
          usage: emptyUsage,
          calls: [{
            callId: "1",
            name: "search_foods",
            arguments: { queries: ["papa", "zanahoria", "pechuga"] },
          }],
        };
      },
    };

    const result = await runTurn({
      userId: "user",
      spentMicroUsd: 0,
      limitMicroUsd: 20_000_000,
      rates: GPT_6_LUNA_STANDARD,
      registry: stubRegistry(async (args) => {
        searches.push(args);
        return { matches: [] };
      }),
      model,
      systemPrompt: "test",
    }, "comí papa zanahoria pechuga");

    expect(searches).toEqual([{ queries: ["papa", "zanahoria", "pechuga"] }]);
    expect(result.kind).toBe("message");
  });
});
