import { searchQueriesFrom, toolInputs, type ToolName } from "./tools";
import { budgetAllows, costMicroUsd, type ModelRates, type TokenUsage } from "./cost";

export const MAX_TOOL_CALLS = 8;

export type ToolCall = {
  callId: string;
  name: string;
  arguments: unknown;
};

export type ModelTurn =
  | { type: "message"; text: string; usage: TokenUsage }
  | { type: "tool_calls"; calls: ToolCall[]; usage: TokenUsage };

export type ModelRequest = {
  systemPrompt: string;
  messages: ReadonlyArray<Record<string, unknown>>;
  toolNames: readonly ToolName[];
};

export interface LanguageModel {
  complete(request: ModelRequest): Promise<ModelTurn>;
}

export type ToolHandler = (arguments_: unknown) => Promise<unknown> | unknown;

export type ToolRegistry = {
  [Name in ToolName]: ToolHandler;
};

export type TurnContext = {
  userId: string;
  spentMicroUsd: number;
  limitMicroUsd: number;
  rates: ModelRates;
  registry: ToolRegistry;
  model: LanguageModel;
  systemPrompt: string;
};

export type ToolTrace = {
  name: string;
  arguments: unknown;
  ok: boolean;
  output: unknown;
};

export type TurnResult =
  | {
      kind: "message";
      text: string;
      chargedMicroUsd: number;
      toolCalls: number;
      traces: ToolTrace[];
      usage: TokenUsage;
    }
  | {
      kind: "budget_exceeded";
      text: string;
      chargedMicroUsd: number;
      traces: ToolTrace[];
      usage: TokenUsage;
    }
  | {
      kind: "tool_limit";
      text: string;
      chargedMicroUsd: number;
      toolCalls: number;
      traces: ToolTrace[];
      usage: TokenUsage;
    };

export type TurnImage = {
  mediaType: "image/jpeg";
  data: string;
};

export async function runTurn(
  context: TurnContext,
  userText: string,
  image?: TurnImage,
): Promise<TurnResult> {
  const messages: Record<string, unknown>[] = [
    image ? { role: "user", text: userText, image } : { role: "user", text: userText },
  ];
  const traces: ToolTrace[] = [];
  let chargedMicroUsd = 0;
  let toolCalls = 0;
  let usage: TokenUsage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };

  while (toolCalls < MAX_TOOL_CALLS) {
    if (!budgetAllows(context.spentMicroUsd + chargedMicroUsd, context.limitMicroUsd)) {
      return {
        kind: "budget_exceeded",
        chargedMicroUsd,
        traces,
        usage,
        text: "Llegamos al tope de 20 USD de este mes. Puedo mostrarte lo que ya está guardado, y no voy a llamar al modelo hasta el mes que viene.",
      };
    }

    const response = await context.model.complete({
      systemPrompt: context.systemPrompt,
      messages,
      toolNames: Object.keys(context.registry) as ToolName[],
    });
    chargedMicroUsd += costMicroUsd(response.usage, context.rates);
    usage = {
      inputTokens: usage.inputTokens + response.usage.inputTokens,
      cachedInputTokens: usage.cachedInputTokens + response.usage.cachedInputTokens,
      outputTokens: usage.outputTokens + response.usage.outputTokens,
    };

    if (response.type === "message" || response.calls.length === 0) {
      return {
        kind: "message",
        text: response.type === "message" ? response.text : "No pude resolver el pedido.",
        chargedMicroUsd,
        toolCalls,
        traces,
        usage,
      };
    }

    toolCalls += 1;
    const round = response.calls.slice(0, 8);
    const executed = await executeRound(context, round);
    traces.push(...executed.traces);
    messages.push({ role: "assistant", calls: round });
    messages.push({ role: "tool", outputs: executed.outputs });
  }

  return {
    kind: "tool_limit",
    chargedMicroUsd,
    toolCalls,
    traces,
    usage,
    text: "No pude terminar la consulta sin pasarme del límite de herramientas.",
  };
}

async function executeRound(context: TurnContext, calls: ToolCall[]) {
  const outputs: Record<string, unknown>[] = [];
  const traces: ToolTrace[] = [];
  const searchCalls = calls.filter((call) => call.name === "search_foods");
  const batchedQueries = searchQueriesFrom({
    queries: searchCalls.flatMap((call) => searchQueriesFrom(call.arguments)),
  });
  let searchOutput: Record<string, unknown> | null = null;

  for (const call of calls) {
    if (call.name === "search_foods") {
      if (!searchOutput) {
        const batched: ToolCall = {
          callId: call.callId,
          name: "search_foods",
          arguments: { queries: batchedQueries },
        };
        searchOutput = await executeCall(context, batched);
        traces.push({
          name: "search_foods",
          arguments: batched.arguments,
          ok: searchOutput.ok === true,
          output: searchOutput.ok === true ? searchOutput.output : searchOutput.error,
        });
      }
      outputs.push({ ...searchOutput, callId: call.callId });
      continue;
    }

    const output = await executeCall(context, call);
    outputs.push(output);
    traces.push({
      name: call.name,
      arguments: call.arguments,
      ok: output.ok === true,
      output: output.ok === true ? output.output : output.error,
    });
  }

  return { outputs, traces };
}

async function executeCall(context: TurnContext, call: ToolCall): Promise<Record<string, unknown>> {
  if (!isToolName(call.name)) {
    return { callId: call.callId, ok: false, error: "unknown_tool" };
  }
  const arguments_ = call.name === "search_foods"
    ? { queries: searchQueriesFrom(call.arguments) }
    : call.arguments;
  const parsed = toolInputs[call.name].safeParse(arguments_);
  if (!parsed.success) {
    return { callId: call.callId, ok: false, error: "invalid_arguments" };
  }
  try {
    const output = await context.registry[call.name](parsed.data);
    return { callId: call.callId, ok: true, output };
  } catch {
    return { callId: call.callId, ok: false, error: "handler_failed" };
  }
}

function isToolName(name: string): name is ToolName {
  return Object.prototype.hasOwnProperty.call(toolInputs, name);
}
