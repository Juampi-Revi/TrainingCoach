import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SYSTEM_PROMPT } from "./prompt";
import { runTurn, type ToolRegistry, type TurnImage } from "./run-turn";
import { GPT_6_LUNA_STANDARD, usdToMicroUsd } from "./cost";
import { FallbackModel, OpenAIResponsesModel } from "./openai-model";
import { cardsFromTraces, type ChatCard } from "./cards";
import * as journal from "./journal.service";
import { localHour, shouldRemindAt } from "./supplement-windows";
import { getAssistantSetting } from "./settings.service";
import { transcribeAudio, type TurnAudio } from "./transcribe";

const PHOTO_LIMIT = 8;
const VOICE_LIMIT = 16;

type PostedMessage = {
  text: string;
  inputKind: "text" | "voice" | "photo";
  clientMessageId: string;
  image?: TurnImage;
  audio?: TurnAudio;
};

export async function openConversation(userId: string) {
  const existing = await prisma.assistantConversation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const conversation = existing ?? await prisma.assistantConversation.create({
    data: { userId },
    select: { id: true },
  });
  return {
    id: conversation.id,
    notes: (await journal.listNotes(userId)).notes,
  };
}

export async function listMessages(userId: string, conversationId: string) {
  await ownedConversation(userId, conversationId);
  const messages = await prisma.assistantMessage.findMany({
    where: { conversationId, userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      text: true,
      inputKind: true,
      createdAt: true,
      imageJpeg: true,
      toolExecutions: {
        orderBy: { createdAt: "asc" },
        select: { toolName: true, arguments: true, result: true, status: true },
      },
    },
  });
  return {
    messages: messages.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      inputKind: message.inputKind,
      createdAt: message.createdAt.toISOString(),
      cards: cardsFromTraces(message.toolExecutions),
      image: message.imageJpeg
        ? `data:image/jpeg;base64,${Buffer.from(message.imageJpeg).toString("base64")}`
        : null,
    })),
  };
}

export async function postMessage(userId: string, conversationId: string, input: PostedMessage) {
  await ownedConversation(userId, conversationId);
  if (input.image && await journal.photoCount(userId) >= PHOTO_LIMIT) {
    return emptyReply(userId, "Hoy ya usaste las 8 fotos. Describí el plato por texto.");
  }
  if (input.audio && await journal.voiceCount(userId) >= VOICE_LIMIT) {
    return emptyReply(userId, "Hoy ya mandaste muchos audios. Escribí o mandá una foto.");
  }
  const replay = await replayTurn(userId, conversationId, input.clientMessageId);
  if (replay) return replay;

  let spokenText = input.text.trim();
  if (input.audio) {
    const openaiKey = await getAssistantSetting("OPENAI_API_KEY");
    if (!openaiKey) return emptyReply(userId, "El audio no está disponible ahora. Escribí el mensaje.");
    try {
      const heard = await transcribeAudio(openaiKey, input.audio);
      if (!heard) return emptyReply(userId, "No pude escuchar ese audio. Probá de nuevo.");
      spokenText = spokenText ? `${heard}. ${spokenText}` : heard;
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      console.error(`assistant_transcribe_failed ${detail.slice(0, 180)}`);
      return emptyReply(userId, "No pude escuchar ese audio. Probá de nuevo.");
    }
  }
  if (!spokenText && !input.image) {
    return emptyReply(userId, "No entendí el mensaje.");
  }

  try {
    await prisma.assistantMessage.create({
      data: {
        conversationId,
        userId,
        role: "user",
        text: spokenText || "Foto",
        inputKind: input.image ? "photo" : input.audio ? "voice" : input.inputKind,
        imageJpeg: input.image ? Buffer.from(input.image.data, "base64") : null,
        clientMessageId: input.clientMessageId,
      },
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const raced = await waitForReplay(userId, conversationId, input.clientMessageId);
    if (raced) return raced;
    return emptyReply(userId, "Todavía estoy contestando ese mensaje.");
  }

  const mode = await assistantMode();
  const openaiKey = await getAssistantSetting("OPENAI_API_KEY");
  const openaiModel = (await getAssistantSetting("OPENAI_MODEL")) || "gpt-6-luna";
  const budgetUsd = Number((await getAssistantSetting("MONTHLY_BUDGET_USD")) || 20);
  let result;
  try {
    result = await runTurn(
      {
        userId,
        spentMicroUsd: await journal.spentMicroUsd(),
        limitMicroUsd: usdToMicroUsd(budgetUsd),
        rates: GPT_6_LUNA_STANDARD,
        registry: registry(userId),
        model: mode === "openai"
          ? new OpenAIResponsesModel(openaiKey, openaiModel)
          : new FallbackModel(),
        systemPrompt: `${SYSTEM_PROMPT}\n\n${await journal.briefing(userId)}\n\n${await recentTalk(userId, conversationId)}`,
      },
      spokenText || "Foto del plato",
      input.image,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    console.error(`assistant_turn_failed ${detail.slice(0, 180)}`);
    const spoken = /image/i.test(detail)
      ? "No pude leer esa foto. Probá con otra."
      : "No pude consultar al asistente. Probá de nuevo en un momento.";
    await prisma.assistantMessage.create({
      data: { conversationId, userId, role: "assistant", text: spoken, inputKind: "text" },
    });
    return emptyReply(userId, spoken);
  }

  const spoken = plain(result.text);
  const cards = cardsFromTraces(result.traces.map((trace) => ({
    toolName: trace.name,
    arguments: trace.arguments,
    result: trace.output,
    status: trace.ok ? "succeeded" : "failed",
  })));
  const assistant = await prisma.assistantMessage.create({
    data: { conversationId, userId, role: "assistant", text: spoken, inputKind: "text" },
  });
  if (result.traces.length > 0) {
    await prisma.assistantToolExecution.createMany({
      data: result.traces.map((trace) => ({
        messageId: assistant.id,
        userId,
        toolName: trace.name,
        arguments: toJson(trace.arguments),
        result: toJson(trace.output),
        status: trace.ok ? "succeeded" : "failed",
      })),
    });
  }
  await prisma.assistantUsageCharge.create({
    data: {
      userId,
      monthKey: journal.monthKey(),
      provider: mode,
      model: mode === "openai" ? openaiModel : "local",
      inputTokens: result.usage.inputTokens,
      cachedInputTokens: result.usage.cachedInputTokens,
      outputTokens: result.usage.outputTokens,
      costMicroUsd: result.chargedMicroUsd,
    },
  });

  return {
    kind: result.kind,
    text: spoken,
    userText: spokenText || "Foto",
    assistantMode: mode,
    day: await journal.day(userId, journal.today()),
    notes: (await journal.listNotes(userId)).notes,
    cards,
    replayed: false,
  };
}

function registry(userId: string): ToolRegistry {
  return {
    search_foods: (args) => journal.searchFoods(userId, readQuery(args)),
    log_meal: (args) => journal.logMeal(userId, args as Parameters<typeof journal.logMeal>[1]),
    get_day_summary: async (args) => summary(await journal.day(userId, readDate(args))),
    list_meals: async (args) => {
      const snapshot = await journal.day(userId, readDate(args));
      return { meals: snapshot.meals };
    },
    update_meal_item: async (args) => {
      const input = args as { mealItemId?: string; quantity?: number; unit?: string; foodId?: string };
      if (!input.mealItemId) return { error: "meal_item_required" };
      return journal.updateMealItem(userId, input.mealItemId, {
        quantity: input.quantity,
        unit: input.unit,
        foodId: input.foodId,
      });
    },
    delete_meal: (args) => {
      const input = args as { mealId: string; confirmed: boolean };
      return journal.deleteMeal(userId, input.mealId, input.confirmed);
    },
    list_supplements: () => journal.listSupplements(userId),
    add_supplement: (args) => journal.addSupplement(userId, args as Parameters<typeof journal.addSupplement>[1]),
    remove_supplement: (args) => journal.removeSupplement(userId, args as { supplementId?: string; name?: string }),
    set_supplement_status: (args) => journal.setSupplementStatus(userId, args as Parameters<typeof journal.setSupplementStatus>[1]),
    list_pending_supplements: async (args) => {
      const snapshot = await journal.day(userId, readDate(args));
      const hour = localHour();
      return {
        supplements: snapshot.supplements.filter(
          (item) => item.status === null && shouldRemindAt(item.timeOfDay, hour),
        ),
      };
    },
    add_note: (args) => journal.addNote(userId, args as Parameters<typeof journal.addNote>[1]),
    list_notes: () => journal.listNotes(userId),
    log_drink: (args) => journal.logDrinks(userId, args as Parameters<typeof journal.logDrinks>[1]),
    suggest_meals: (args) => journal.suggestMeals(userId, args as Parameters<typeof journal.suggestMeals>[1]),
    log_plate: (args) => journal.logPlate(userId, args as Parameters<typeof journal.logPlate>[1]),
    review_last_meal: () => journal.reviewLastMeal(userId),
    get_account: () => journal.readAccount(userId),
  };
}

async function recentTalk(userId: string, conversationId: string): Promise<string> {
  const rows = await prisma.assistantMessage.findMany({
    where: { conversationId, userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { role: true, text: true },
  });
  if (rows.length === 0) return "";
  const ordered = rows.reverse();
  if (ordered.at(-1)?.role === "user") ordered.pop();
  if (ordered.length === 0) return "";
  return ["Conversación reciente:", ...ordered.map((row) => `${row.role === "user" ? "Persona" : "Vos"}: ${row.text.slice(0, 500)}`)].join("\n");
}

async function ownedConversation(userId: string, conversationId: string): Promise<void> {
  const conversation = await prisma.assistantConversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });
  if (!conversation) throw new Error("not_found");
}

async function waitForReplay(userId: string, conversationId: string, clientMessageId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const replay = await replayTurn(userId, conversationId, clientMessageId);
    if (replay) return replay;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return null;
}

async function replayTurn(userId: string, conversationId: string, clientMessageId: string) {
  const existing = await prisma.assistantMessage.findUnique({
    where: { userId_clientMessageId: { userId, clientMessageId } },
  });
  if (!existing || existing.conversationId !== conversationId) return null;
  const assistant = await prisma.assistantMessage.findFirst({
    where: { conversationId, userId, role: "assistant", createdAt: { gt: existing.createdAt } },
    orderBy: { createdAt: "asc" },
  });
  if (!assistant) return null;
  const traces = await prisma.assistantToolExecution.findMany({
    where: { messageId: assistant.id },
    orderBy: { createdAt: "asc" },
    select: { toolName: true, arguments: true, result: true, status: true },
  });
  return {
    kind: "message" as const,
    text: assistant.text,
    userText: existing.text,
    assistantMode: await assistantMode(),
    day: await journal.day(userId, journal.today()),
    notes: (await journal.listNotes(userId)).notes,
    cards: cardsFromTraces(traces),
    replayed: true,
  };
}

async function emptyReply(userId: string, text: string) {
  return {
    kind: "message" as const,
    text,
    userText: undefined as string | undefined,
    assistantMode: await assistantMode(),
    day: await journal.day(userId, journal.today()),
    notes: (await journal.listNotes(userId)).notes,
    cards: [] as ChatCard[],
    replayed: false,
  };
}

async function assistantMode(): Promise<"local" | "openai"> {
  return (await getAssistantSetting("OPENAI_API_KEY")) ? "openai" : "local";
}

function readQuery(args: unknown): string {
  return args && typeof args === "object" && "query" in args ? String((args as { query: unknown }).query) : "";
}

function readDate(args: unknown): string {
  if (args && typeof args === "object" && "localDate" in args && typeof (args as { localDate: unknown }).localDate === "string") {
    return (args as { localDate: string }).localDate;
  }
  return journal.today();
}

function summary(snapshot: Awaited<ReturnType<typeof journal.day>>) {
  return {
    localDate: snapshot.localDate,
    consumed: snapshot.consumed,
    goals: snapshot.goals,
    remaining: snapshot.remaining,
    meals: snapshot.meals,
    drinks: snapshot.drinks.map((drink) => ({
      displayName: drink.displayName,
      milliliters: drink.milliliters,
      kcal: drink.kcal,
    })),
    liquidsMl: snapshot.liquidsMl,
  };
}

function plain(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
