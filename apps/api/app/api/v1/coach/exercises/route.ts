import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";
import { listCoachExercises } from "@/lib/training/exercise.service";

const DIFFICULTY_VALUES = ["beginner", "intermediate", "advanced"] as const;
const OBJECTIVE_VALUES = ["strength", "hypertrophy", "conditioning", "mobility", "skill"] as const;

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function looksLikeSchemaOutOfDate(msg: string): boolean {
  return msg.includes("does not exist") && (msg.includes("difficulty") || msg.includes("objective"));
}

function toStringList(input: string | null): string[] | null {
  if (!input) return null;
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

function toBool(input: string | null): boolean | null {
  if (!input) return null;
  if (input === "true" || input === "1") return true;
  if (input === "false" || input === "0") return false;
  return null;
}

function toMediaFilter(input: string | null): "any" | "complete" | "missing" | "missingImage" | "missingVideo" {
  if (!input) return "any";
  if (input === "complete") return "complete";
  if (input === "missing") return "missing";
  if (input === "missingImage") return "missingImage";
  if (input === "missingVideo") return "missingVideo";
  return "any";
}

function toInt(input: string | null): number | null {
  if (!input) return null;
  const n = parseInt(input);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") ?? "";
    const muscles = toStringList(searchParams.get("muscle"));
    const equipments = toStringList(searchParams.get("equipment"));
    const difficulties = toStringList(searchParams.get("difficulty"));
    const objectives = toStringList(searchParams.get("objective"));
    const favoritesOnly = toBool(searchParams.get("favorites")) ?? false;
    const basicsOnly = toBool(searchParams.get("basic")) ?? false;
    const mediaFilter = toMediaFilter(searchParams.get("media"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
    const offset = Math.max(0, Math.min(5000, toInt(searchParams.get("offset")) ?? 0));

    const items = await listCoachExercises({
      coachUserId: auth.user.sub,
      q: q.trim(),
      muscles,
      equipments,
      difficulties,
      objectives,
      favoritesOnly,
      basicsOnly,
      limit,
      offset,
      mediaFilter,
    });
    return ok(items);
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const name = (body.name ?? "").trim();
    if (!name) return err("El nombre es obligatorio", 400);

    const difficulty =
      typeof body.difficulty === "string" && body.difficulty.trim()
        ? body.difficulty.trim()
        : null;
    const objective =
      typeof body.objective === "string" && body.objective.trim()
        ? body.objective.trim()
        : null;

    if (difficulty && !DIFFICULTY_VALUES.includes(difficulty as (typeof DIFFICULTY_VALUES)[number])) {
      return err("Dificultad inválida", 400);
    }
    if (objective && !OBJECTIVE_VALUES.includes(objective as (typeof OBJECTIVE_VALUES)[number])) {
      return err("Objetivo inválido", 400);
    }

    let exercise;
    try {
      exercise = await prisma.exercise.create({
        data: {
          name,
          primaryMuscle: body.primaryMuscle || null,
          equipment: body.equipment?.trim() || null,
          difficulty,
          objective,
          coachUserId: auth.user.sub,
          isSystem: false,
        },
      });
    } catch (e: unknown) {
      const msg = messageOf(e);
      if (looksLikeSchemaOutOfDate(msg)) {
        return err("La base de datos no está actualizada para crear ejercicios. Corré las migraciones de Prisma.", 409);
      }
      if (msg.includes("Unique constraint")) return err("Ya existe un ejercicio con ese nombre", 409);
      throw e;
    }

    return ok({
      id: exercise.id,
      name: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      equipment: exercise.equipment,
      difficulty: exercise.difficulty ?? null,
      objective: exercise.objective ?? null,
      isSystem: exercise.isSystem,
      thumbnailUrl: null,
    });
  });
}
