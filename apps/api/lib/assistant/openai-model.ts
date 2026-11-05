import { toolInputs, type ToolName } from "./tools";
import type { LanguageModel, ModelRequest, ModelTurn, ToolCall } from "./run-turn";

const DESCRIPTIONS: Record<ToolName, string> = {
  search_foods: "Busca todos los alimentos detectados en una sola llamada. Mandá queries con cada nombre. Nunca la llames una vez por alimento.",
  log_meal: "Guarda una comida. El servidor calcula los nutrientes.",
  get_day_summary: "Totales ya calculados del día.",
  list_meals: "Comidas guardadas del día, con ids.",
  update_meal_item: "Corrige cantidad, unidad o alimento de una línea ya guardada. No crea otra comida.",
  delete_meal: "Pide confirmación o borra si confirmed es true.",
  list_supplements: "Suplementos que la persona configuró.",
  add_supplement: "Agrega un suplemento que la persona pidió recordar.",
  remove_supplement: "Deja de recordar un suplemento si la persona pidió sacarlo.",
  set_supplement_status: "Marca un suplemento de hoy como planned, taken o skipped.",
  list_pending_supplements: "Suplementos de hoy que todavía no tienen respuesta. Usalo para mostrar chips si hay pendientes.",
  add_note: "Guarda un apunte con el texto de la persona. Si dijo hora, remindLocal usa la fecha local.",
  list_notes: "Apuntes abiertos de esta cuenta.",
  log_drink: "Guarda lo que la persona tomó. El servidor calcula mililitros y calorías.",
  suggest_meals: "Calcula hasta 3 platos con alimentos ya buscados, también para más tarde. No los guarda.",
  log_plate: "Guarda un plato mixto. Mandá todos los alimentos juntos; omití grams para usar 1 porción estándar. El servidor busca y calcula. No uses search_foods antes.",
  review_last_meal: "Última comida guardada con macros reales, lo consumido y lo que resta del día. Usalo para opinar.",
  get_account: "Devuelve el cuerpo, la dieta con sus macros, los suplementos y los recordatorios configurados.",
};

export class OpenAIResponsesModel implements LanguageModel {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete(request: ModelRequest): Promise<ModelTurn> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        reasoning: { effort: "low" },
        instructions: request.systemPrompt,
        input: toInput(request.messages),
        tools: request.toolNames.map((name) => ({
          type: "function",
          name,
          description: DESCRIPTIONS[name],
          parameters: toolInputs[name].toJSONSchema(),
          strict: false,
        })),
      }),
    });
    const body = (await response.json()) as ResponsesBody;
    if (!response.ok) {
      throw new Error(body.error?.message ?? `openai_${response.status}`);
    }
    const usage = readUsage(body);
    const calls = (body.output ?? []).flatMap((item): ToolCall[] => {
      if (item.type !== "function_call" || !item.call_id || !item.name) return [];
      return [{
        callId: item.call_id,
        name: item.name,
        arguments: parseArguments(item.arguments),
      }];
    });
    if (calls.length > 0) return { type: "tool_calls", calls, usage };
    const text = (body.output ?? [])
      .flatMap((item) => item.content ?? [])
      .filter((part) => part.type === "output_text" && part.text)
      .map((part) => part.text)
      .join("\n")
      .trim();
    return { type: "message", usage, text: text || "No pude resolver el pedido." };
  }
}

export class FallbackModel implements LanguageModel {
  async complete(request: ModelRequest): Promise<ModelTurn> {
    const lastTool = [...request.messages].reverse().find((row) => row.role === "tool");
    if (lastTool && Array.isArray(lastTool.outputs)) {
      const first = lastTool.outputs[0] as { ok?: unknown; output?: unknown } | undefined;
      return {
        type: "message",
        usage: emptyUsage(),
        text: first?.ok === true ? fallbackDayText(first.output) : "No pude leer el día.",
      };
    }
    const last = [...request.messages].reverse().find((row) => row.role === "user");
    const text = typeof last?.text === "string" ? last.text : "";
    if (/\b(cuanta|cuantas|llevo|falta|como voy|como vengo)\b/i.test(text)) {
      return {
        type: "tool_calls",
        usage: emptyUsage(),
        calls: [{ callId: "local-day", name: "get_day_summary", arguments: {} }],
      };
    }
    return {
      type: "message",
      usage: emptyUsage(),
      text: "El asistente de nutrición no está conectado al modelo. Configurá OPENAI_API_KEY o pedime el resumen del día.",
    };
  }
}

function emptyUsage() {
  return { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };
}

function fallbackDayText(output: unknown): string {
  if (!output || typeof output !== "object") return "Hoy no hay números todavía.";
  const row = output as {
    consumed?: { kcal?: number; proteinG?: number };
    remaining?: { kcal?: number | null; proteinG?: number | null };
    liquidsMl?: number;
  };
  const kcal = row.consumed?.kcal ?? 0;
  const protein = row.consumed?.proteinG ?? 0;
  const liquids = row.liquidsMl ?? 0;
  const remainKcal = row.remaining?.kcal;
  const remainProtein = row.remaining?.proteinG;
  const n = (value: number) => Math.round(value).toLocaleString("es-AR");
  const rest = [
    remainKcal != null ? `restan ${n(remainKcal)} kcal` : null,
    remainProtein != null ? `restan ${n(remainProtein)} g de proteína` : null,
  ].filter((part): part is string => Boolean(part));
  return `Hoy llevás ${n(kcal)} kcal, ${n(protein)} g de proteína y ${n(liquids)} ml. ${rest.join(", ") || "Sin objetivo cargado."}`.trim();
}

type ResponsesBody = {
  output?: Array<{
    type: string;
    call_id?: string;
    name?: string;
    arguments?: string;
    content?: Array<{ type: string; text?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string };
};

function toInput(messages: ModelRequest["messages"]): unknown[] {
  return messages.flatMap((message): unknown[] => {
    if (message.role === "user" && typeof message.text === "string") {
      const image = message.image;
      if (image && typeof image === "object") {
        const record = image as { mediaType?: unknown; data?: unknown };
        if (typeof record.mediaType === "string" && typeof record.data === "string") {
          return [{
            role: "user",
            content: [
              { type: "input_text", text: message.text },
              {
                type: "input_image",
                image_url: `data:${record.mediaType};base64,${record.data}`,
                detail: "low",
              },
            ],
          }];
        }
      }
      return [{ role: "user", content: message.text }];
    }
    if (message.role === "assistant" && Array.isArray(message.calls)) {
      return message.calls.flatMap((call) => {
        if (!call || typeof call !== "object") return [];
        const record = call as { callId?: unknown; name?: unknown; arguments?: unknown };
        return [{
          type: "function_call",
          call_id: String(record.callId ?? ""),
          name: String(record.name ?? ""),
          arguments: JSON.stringify(record.arguments ?? {}),
        }];
      });
    }
    if (message.role === "tool" && Array.isArray(message.outputs)) {
      return message.outputs.flatMap((output) => {
        if (!output || typeof output !== "object") return [];
        const record = output as { callId?: unknown; ok?: unknown; output?: unknown; error?: unknown };
        return [{
          type: "function_call_output",
          call_id: String(record.callId ?? ""),
          output: JSON.stringify(record.ok === true ? record.output : { error: record.error }),
        }];
      });
    }
    return [];
  });
}

function parseArguments(value: string | undefined): unknown {
  if (!value) return {};
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

function readUsage(body: ResponsesBody) {
  const inputTokens = Math.max(0, Math.floor(body.usage?.input_tokens ?? 0));
  const outputTokens = Math.max(0, Math.floor(body.usage?.output_tokens ?? 0));
  const cached = Math.max(0, Math.floor(body.usage?.input_tokens_details?.cached_tokens ?? 0));
  return {
    inputTokens,
    cachedInputTokens: Math.min(cached, inputTokens),
    outputTokens,
  };
}
