import { prisma } from "../lib/prisma";

type SparqlBindings = {
  item: { type: string; value: string };
  itemLabel?: { type: string; value: string };
  muscles?: { type: string; value: string };
  equipment?: { type: string; value: string };
  image?: { type: string; value: string };
};

type SystemExercise = {
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  imageUrl: string | null;
  source: string;
  sourceId: string;
  isSystem: boolean;
  coachUserId: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeCommaList(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeEquipment(value: string | null | undefined) {
  const candidates = normalizeCommaList(value);
  if (candidates.length === 0) return null;

  const rejected = new Set([
    "human",
    "human body",
    "body",
    "persona",
    "person",
    "cuerpo humano",
    "ejercicio físico",
    "physical exercise",
  ]);

  const cleaned = candidates.filter((c) => {
    const lower = c.toLowerCase();
    if (rejected.has(lower)) return false;
    if (lower.includes("human body")) return false;
    return true;
  });

  const picked = (cleaned.length > 0 ? cleaned : candidates).slice(0, 3);
  return picked.length > 0 ? picked.join(", ") : null;
}

function normalizeMuscles(value: string | null | undefined) {
  const candidates = normalizeCommaList(value);
  const picked = candidates.slice(0, 3);
  return picked.length > 0 ? picked.join(", ") : null;
}

function qidFromEntityUrl(url: string) {
  const match = url.match(/\/entity\/(Q\d+)$/);
  return match?.[1] ?? null;
}

function nameKey(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[’'"]/g, "")
    .replace(/[^a-z0-9áéíóúñü\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceIdFromName(name: string) {
  const k = nameKey(name);
  return k.replace(/\s+/g, "-").slice(0, 120);
}

function normalizeMediaUrl(url: string) {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://")) return `https://${trimmed.slice(7)}`;
  return trimmed;
}

const seedExercises: Array<{ name: string; primaryMuscle: string; equipment: string }> = [
  { name: "Back squat", primaryMuscle: "Piernas", equipment: "Barra" },
  { name: "Front squat", primaryMuscle: "Piernas", equipment: "Barra" },
  { name: "Overhead squat", primaryMuscle: "Piernas", equipment: "Barra" },
  { name: "Goblet squat", primaryMuscle: "Piernas", equipment: "Mancuernas" },
  { name: "Bulgarian split squat", primaryMuscle: "Piernas", equipment: "Mancuernas" },
  { name: "Split squat", primaryMuscle: "Piernas", equipment: "Mancuernas" },
  { name: "Walking lunge", primaryMuscle: "Piernas", equipment: "Mancuernas" },
  { name: "Reverse lunge", primaryMuscle: "Piernas", equipment: "Mancuernas" },
  { name: "Step-up", primaryMuscle: "Piernas", equipment: "Banco" },
  { name: "Leg press", primaryMuscle: "Piernas", equipment: "Máquina" },
  { name: "Hack squat", primaryMuscle: "Piernas", equipment: "Máquina" },
  { name: "Deadlift", primaryMuscle: "Piernas", equipment: "Barra" },
  { name: "Romanian deadlift", primaryMuscle: "Piernas", equipment: "Barra" },
  { name: "Stiff-leg deadlift", primaryMuscle: "Piernas", equipment: "Barra" },
  { name: "Sumo deadlift", primaryMuscle: "Piernas", equipment: "Barra" },
  { name: "Good-morning", primaryMuscle: "Piernas", equipment: "Barra" },
  { name: "Hip thrust", primaryMuscle: "Glúteos", equipment: "Barra, Banco" },
  { name: "Glute bridge", primaryMuscle: "Glúteos", equipment: "Barra" },
  { name: "Leg extension", primaryMuscle: "Piernas", equipment: "Máquina" },
  { name: "Leg curl", primaryMuscle: "Piernas", equipment: "Máquina" },
  { name: "Calf raise", primaryMuscle: "Pantorrillas", equipment: "Máquina" },
  { name: "Seated calf raise", primaryMuscle: "Pantorrillas", equipment: "Máquina" },

  { name: "Bench press", primaryMuscle: "Pecho", equipment: "Barra, Banco" },
  { name: "Incline bench press", primaryMuscle: "Pecho", equipment: "Barra, Banco" },
  { name: "Decline bench press", primaryMuscle: "Pecho", equipment: "Barra, Banco" },
  { name: "Dumbbell bench press", primaryMuscle: "Pecho", equipment: "Mancuernas, Banco" },
  { name: "Incline dumbbell press", primaryMuscle: "Pecho", equipment: "Mancuernas, Banco" },
  { name: "Push-up", primaryMuscle: "Pecho", equipment: "Peso corporal" },
  { name: "Dip", primaryMuscle: "Pecho", equipment: "Peso corporal" },
  { name: "Chest fly", primaryMuscle: "Pecho", equipment: "Mancuernas, Banco" },
  { name: "Cable fly", primaryMuscle: "Pecho", equipment: "Polea" },
  { name: "Pec deck", primaryMuscle: "Pecho", equipment: "Máquina" },

  { name: "Pull-up", primaryMuscle: "Espalda", equipment: "Peso corporal" },
  { name: "Chin-up", primaryMuscle: "Espalda", equipment: "Peso corporal" },
  { name: "weighted pull-up", primaryMuscle: "Espalda", equipment: "Peso corporal, Lastre" },
  { name: "Lat pulldown", primaryMuscle: "Espalda", equipment: "Polea" },
  { name: "Seated cable row", primaryMuscle: "Espalda", equipment: "Polea" },
  { name: "Barbell row", primaryMuscle: "Espalda", equipment: "Barra" },
  { name: "bent-over row", primaryMuscle: "Espalda", equipment: "Barra" },
  { name: "One-arm dumbbell row", primaryMuscle: "Espalda", equipment: "Mancuernas, Banco" },
  { name: "T-bar row", primaryMuscle: "Espalda", equipment: "Máquina" },
  { name: "Face pull", primaryMuscle: "Espalda", equipment: "Polea" },
  { name: "Reverse fly", primaryMuscle: "Espalda", equipment: "Mancuernas" },

  { name: "Overhead press", primaryMuscle: "Hombros", equipment: "Barra" },
  { name: "Military press", primaryMuscle: "Hombros", equipment: "Barra" },
  { name: "Dumbbell shoulder press", primaryMuscle: "Hombros", equipment: "Mancuernas" },
  { name: "Arnold press", primaryMuscle: "Hombros", equipment: "Mancuernas" },
  { name: "Lateral raise", primaryMuscle: "Hombros", equipment: "Mancuernas" },
  { name: "Front raise", primaryMuscle: "Hombros", equipment: "Mancuernas" },
  { name: "Rear delt fly", primaryMuscle: "Hombros", equipment: "Mancuernas" },
  { name: "shoulder shrug", primaryMuscle: "Hombros", equipment: "Mancuernas" },

  { name: "Barbell curl", primaryMuscle: "Bíceps", equipment: "Barra" },
  { name: "Dumbbell curl", primaryMuscle: "Bíceps", equipment: "Mancuernas" },
  { name: "Hammer curl", primaryMuscle: "Bíceps", equipment: "Mancuernas" },
  { name: "Preacher curl", primaryMuscle: "Bíceps", equipment: "Barra, Banco" },

  { name: "pushdown", primaryMuscle: "Tríceps", equipment: "Polea" },
  { name: "Tricep pushdown", primaryMuscle: "Tríceps", equipment: "Polea" },
  { name: "Skull crusher", primaryMuscle: "Tríceps", equipment: "Barra, Banco" },
  { name: "Overhead tricep extension", primaryMuscle: "Tríceps", equipment: "Mancuernas" },
  { name: "Close-grip bench press", primaryMuscle: "Tríceps", equipment: "Barra, Banco" },

  { name: "Plank", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Side plank", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Crunch", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "hanging crunches", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Hanging leg raise", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Sit-up", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Cable crunch", primaryMuscle: "Abdomen", equipment: "Polea" },

  { name: "farmer's walk", primaryMuscle: "Cuerpo completo", equipment: "Mancuernas" },
  { name: "Suitcase carry", primaryMuscle: "Cuerpo completo", equipment: "Mancuernas" },

  { name: "Kettlebell swing", primaryMuscle: "Cuerpo completo", equipment: "Kettlebell" },
  { name: "Log lift", primaryMuscle: "Hombros", equipment: "Strongman log" },
  { name: "Trap bar deadlift", primaryMuscle: "Piernas", equipment: "Trap bar" },
  { name: "Smith machine squat", primaryMuscle: "Piernas", equipment: "Máquina Smith" },
  { name: "Smith machine bench press", primaryMuscle: "Pecho", equipment: "Máquina Smith, Banco" },
  { name: "Lying leg curl", primaryMuscle: "Piernas", equipment: "Máquina" },
  { name: "Seated leg curl", primaryMuscle: "Piernas", equipment: "Máquina" },
  { name: "Walking lunges", primaryMuscle: "Piernas", equipment: "Mancuernas" },
  { name: "Hack squat machine", primaryMuscle: "Piernas", equipment: "Máquina" },
  { name: "Belt squat", primaryMuscle: "Piernas", equipment: "Máquina" },
  { name: "Standing calf raise", primaryMuscle: "Pantorrillas", equipment: "Máquina" },
  { name: "Donkey calf raise", primaryMuscle: "Pantorrillas", equipment: "Máquina" },
  { name: "Hip abduction", primaryMuscle: "Glúteos", equipment: "Máquina" },
  { name: "Hip adduction", primaryMuscle: "Piernas", equipment: "Máquina" },

  { name: "Dumbbell shoulder press", primaryMuscle: "Hombros", equipment: "Mancuernas, Banco" },
  { name: "Seated dumbbell shoulder press", primaryMuscle: "Hombros", equipment: "Mancuernas, Banco" },
  { name: "Seated barbell overhead press", primaryMuscle: "Hombros", equipment: "Barra, Banco" },
  { name: "Cable lateral raise", primaryMuscle: "Hombros", equipment: "Polea" },
  { name: "Cable front raise", primaryMuscle: "Hombros", equipment: "Polea" },
  { name: "Rear delt cable fly", primaryMuscle: "Hombros", equipment: "Polea" },
  { name: "Upright row", primaryMuscle: "Hombros", equipment: "Barra" },
  { name: "Dumbbell upright row", primaryMuscle: "Hombros", equipment: "Mancuernas" },

  { name: "Incline push-up", primaryMuscle: "Pecho", equipment: "Peso corporal" },
  { name: "Decline push-up", primaryMuscle: "Pecho", equipment: "Peso corporal" },
  { name: "Close-grip push-up", primaryMuscle: "Tríceps", equipment: "Peso corporal" },
  { name: "Cable chest press", primaryMuscle: "Pecho", equipment: "Polea" },
  { name: "Machine chest press", primaryMuscle: "Pecho", equipment: "Máquina" },
  { name: "Dumbbell pullover", primaryMuscle: "Pecho", equipment: "Mancuernas, Banco" },
  { name: "Barbell pullover", primaryMuscle: "Pecho", equipment: "Barra, Banco" },
  { name: "Incline cable fly", primaryMuscle: "Pecho", equipment: "Polea" },
  { name: "Decline cable fly", primaryMuscle: "Pecho", equipment: "Polea" },
  { name: "Dumbbell fly", primaryMuscle: "Pecho", equipment: "Mancuernas, Banco" },

  { name: "Neutral-grip pull-up", primaryMuscle: "Espalda", equipment: "Peso corporal" },
  { name: "Assisted pull-up", primaryMuscle: "Espalda", equipment: "Máquina" },
  { name: "Assisted dip", primaryMuscle: "Pecho", equipment: "Máquina" },
  { name: "Cable row", primaryMuscle: "Espalda", equipment: "Polea" },
  { name: "Chest-supported row", primaryMuscle: "Espalda", equipment: "Máquina" },
  { name: "Dumbbell row", primaryMuscle: "Espalda", equipment: "Mancuernas, Banco" },
  { name: "Machine row", primaryMuscle: "Espalda", equipment: "Máquina" },
  { name: "Straight-arm pulldown", primaryMuscle: "Espalda", equipment: "Polea" },
  { name: "Pull-over (cable)", primaryMuscle: "Espalda", equipment: "Polea" },

  { name: "Concentration curl", primaryMuscle: "Bíceps", equipment: "Mancuernas" },
  { name: "Incline dumbbell curl", primaryMuscle: "Bíceps", equipment: "Mancuernas, Banco" },
  { name: "Cable curl", primaryMuscle: "Bíceps", equipment: "Polea" },
  { name: "EZ-bar curl", primaryMuscle: "Bíceps", equipment: "Barra" },

  { name: "Tricep extension", primaryMuscle: "Tríceps", equipment: "Polea" },
  { name: "Cable tricep extension", primaryMuscle: "Tríceps", equipment: "Polea" },
  { name: "Overhead cable tricep extension", primaryMuscle: "Tríceps", equipment: "Polea" },
  { name: "Dumbbell tricep extension", primaryMuscle: "Tríceps", equipment: "Mancuernas" },
  { name: "Bench dip", primaryMuscle: "Tríceps", equipment: "Banco" },

  { name: "Bicycle crunch", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Russian twist", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Mountain climber", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Dead bug", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Bird dog", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Ab wheel rollout", primaryMuscle: "Abdomen", equipment: "Rueda abdominal" },
  { name: "Hanging knee raise", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Leg raise", primaryMuscle: "Abdomen", equipment: "Peso corporal" },
  { name: "Cable woodchop", primaryMuscle: "Abdomen", equipment: "Polea" },
];

const seedIndex = new Map<string, { primaryMuscle: string; equipment: string }>(
  seedExercises.map((e) => [nameKey(e.name), { primaryMuscle: e.primaryMuscle, equipment: e.equipment }]),
);

function inferPrimaryMuscle(name: string) {
  const n = nameKey(name);
  if (n.includes("crunch") || n.includes("plank") || n.includes("sit up") || n.includes("sit-up") || n.includes("leg raise"))
    return "Abdomen";
  if (n.includes("bench") || n.includes("press") || n.includes("push up") || n.includes("push-up") || n.includes("fly"))
    return "Pecho";
  if (n.includes("pull up") || n.includes("pull-up") || n.includes("chin up") || n.includes("chin-up") || n.includes("row") || n.includes("pulldown"))
    return "Espalda";
  if (n.includes("curl")) return "Bíceps";
  if (n.includes("tricep") || n.includes("trícep") || n.includes("pushdown") || n.includes("skull")) return "Tríceps";
  if (n.includes("shoulder") || n.includes("overhead") || n.includes("military") || n.includes("raise") || n.includes("shrug"))
    return "Hombros";
  if (n.includes("hip thrust") || n.includes("glute")) return "Glúteos";
  if (n.includes("calf")) return "Pantorrillas";
  if (n.includes("squat") || n.includes("deadlift") || n.includes("lunge") || n.includes("leg ") || n.includes("good morning") || n.includes("good-morning"))
    return "Piernas";
  if (n.includes("farmer") || n.includes("carry") || n.includes("kettlebell swing")) return "Cuerpo completo";
  return null;
}

function inferEquipment(name: string) {
  const n = nameKey(name);
  if (n.includes("kettlebell")) return "Kettlebell";
  if (n.includes("dumbbell")) return "Mancuernas";
  if (n.includes("barbell")) return "Barra";
  if (n.includes("cable") || n.includes("pushdown") || n.includes("pulldown") || n.includes("face pull")) return "Polea";
  if (n.includes("machine") || n.includes("pec deck") || n.includes("leg press")) return "Máquina";
  if (n.includes("bench") || n.includes("incline") || n.includes("decline")) return "Banco";
  if (n.includes("pull up") || n.includes("pull-up") || n.includes("chin up") || n.includes("chin-up") || n.includes("push up") || n.includes("push-up"))
    return "Peso corporal";
  if (n.includes("farmer") || n.includes("carry")) return "Mancuernas";
  return null;
}

function enrichFromSeedAndHeuristics(name: string, primaryMuscle: string | null, equipment: string | null) {
  const seed = seedIndex.get(nameKey(name));
  const pm = primaryMuscle ?? seed?.primaryMuscle ?? inferPrimaryMuscle(name);
  const eq = equipment ?? seed?.equipment ?? inferEquipment(name);
  return { primaryMuscle: pm, equipment: eq };
}

async function ensureExerciseImage(exerciseId: string, url: string) {
  const normalizedUrl = normalizeMediaUrl(url);
  const existing = await prisma.exerciseMedia.findFirst({
    where: { exerciseId, mediaType: "image", url: normalizedUrl },
    select: { id: true },
  });
  if (existing) return;
  await prisma.exerciseMedia.create({
    data: { exerciseId, mediaType: "image", url: normalizedUrl },
    select: { id: true },
  });
}

async function upsertSystemExercise(row: SystemExercise) {
  const existingBySource = await prisma.exercise.findUnique({
    where: { source_sourceId: { source: row.source, sourceId: row.sourceId } },
    select: { id: true, primaryMuscle: true, equipment: true },
  });

  if (existingBySource) {
    const nextPrimaryMuscle = existingBySource.primaryMuscle || row.primaryMuscle;
    const nextEquipment = existingBySource.equipment || row.equipment;
    const updated = await prisma.exercise.update({
      where: { id: existingBySource.id },
      data: {
        name: row.name,
        primaryMuscle: nextPrimaryMuscle,
        equipment: nextEquipment,
        isSystem: true,
        coachUserId: null,
      },
      select: { id: true },
    });
    return { status: "updated" as const, id: updated.id };
  }

  const existingByName = await prisma.exercise.findFirst({
    where: { isSystem: true, name: { equals: row.name, mode: "insensitive" } },
    select: { id: true, source: true, sourceId: true, primaryMuscle: true, equipment: true },
  });

  if (existingByName) {
    const nextPrimaryMuscle = existingByName.primaryMuscle || row.primaryMuscle;
    const nextEquipment = existingByName.equipment || row.equipment;
    const shouldAdoptSource = (existingByName.source == null || existingByName.source === "seed") && row.source !== "seed";
    const updated = await prisma.exercise.update({
      where: { id: existingByName.id },
      data: {
        name: row.name,
        primaryMuscle: nextPrimaryMuscle,
        equipment: nextEquipment,
        isSystem: true,
        coachUserId: null,
        source: shouldAdoptSource ? row.source : existingByName.source,
        sourceId: shouldAdoptSource ? row.sourceId : existingByName.sourceId,
      },
      select: { id: true },
    });
    return { status: "updated" as const, id: updated.id };
  }

  const created = await prisma.exercise.create({
    data: {
      name: row.name,
      primaryMuscle: row.primaryMuscle,
      equipment: row.equipment,
      isSystem: row.isSystem,
      source: row.source,
      sourceId: row.sourceId,
      coachUserId: row.coachUserId,
    },
    select: { id: true },
  });
  return { status: "inserted" as const, id: created.id };
}

async function fetchWithRetry(url: string, attempts = 5) {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": "training-challenge-recomposition/1.0 (import-wikidata-exercises)",
        },
      });

      if (res.status === 429 || res.status >= 500) {
        const wait = Math.min(30_000, 750 * 2 ** i);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        throw new Error(`Wikidata request failed: ${res.status} ${res.statusText}`);
      }

      return res.json() as Promise<{ results: { bindings: SparqlBindings[] } }>;
    } catch (e) {
      lastErr = e;
      const wait = Math.min(30_000, 750 * 2 ** i);
      await sleep(wait);
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Wikidata request failed");
}

async function main() {
  const pageSize = Number(process.env.WDQS_LIMIT ?? 1000);
  const maxItems = Number(process.env.WDQS_MAX ?? 20000);
  const language = process.env.WDQS_LANG ?? "es,en";
  const importWikidata = String(process.env.IMPORT_WIKIDATA ?? "1") !== "0";

  const weightTrainingExerciseQid = "Q50320205";
  const endpoint = "https://query.wikidata.org/sparql";

  let offset = 0;
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalUpdated = 0;

  {
    let inserted = 0;
    let updated = 0;
    for (const seed of seedExercises) {
      const row: SystemExercise = {
        name: seed.name,
        primaryMuscle: seed.primaryMuscle,
        equipment: seed.equipment,
        imageUrl: null,
        isSystem: true,
        source: "seed",
        sourceId: sourceIdFromName(seed.name),
        coachUserId: null,
      };
      const res = await upsertSystemExercise(row);
      if (res.status === "inserted") inserted += 1;
      else updated += 1;
    }
    process.stdout.write(`seed: inserted=${inserted} updated=${updated}\n`);
  }

  if (!importWikidata) {
    process.stdout.write("wikidata: skipped\n");
    process.stdout.write(
      `Done. processed=${totalProcessed} inserted=${totalInserted} updated=${totalUpdated} system exercises from Wikidata.\n`,
    );
    return;
  }

  while (totalProcessed < maxItems) {
    const sparql = `
      SELECT
        ?item
        ?itemLabel
        (GROUP_CONCAT(DISTINCT ?muscleLabel; separator=", ") AS ?muscles)
        (GROUP_CONCAT(DISTINCT ?equipmentItemLabel; separator=", ") AS ?equipment)
        (SAMPLE(?image) AS ?image)
      WHERE {
        ?item (wdt:P31/(wdt:P279*)) wd:${weightTrainingExerciseQid} .
        OPTIONAL { ?item wdt:P6884 ?muscle . }
        OPTIONAL { ?item wdt:P2283 ?equipmentItem . }
        OPTIONAL { ?item wdt:P18 ?image . }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${language}" . }
      }
      GROUP BY ?item ?itemLabel
      ORDER BY ?item
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const url = `${endpoint}?format=json&query=${encodeURIComponent(sparql)}`;
    let json: { results: { bindings: SparqlBindings[] } };
    try {
      json = await fetchWithRetry(url);
    } catch (e) {
      process.stdout.write(`wikidata: failed (${String(e instanceof Error ? e.message : e)})\n`);
      break;
    }
    const bindings = json.results.bindings ?? [];
    if (bindings.length === 0) break;

    const data = bindings
      .map((b) => {
        const qid = qidFromEntityUrl(b.item.value);
        const name = b.itemLabel?.value?.trim() ?? "";
        const normalizedPrimaryMuscle = normalizeMuscles(b.muscles?.value);
        const normalizedEquipment = normalizeEquipment(b.equipment?.value);
        const enriched = enrichFromSeedAndHeuristics(name, normalizedPrimaryMuscle, normalizedEquipment);
        const imageUrl = b.image?.value ? normalizeMediaUrl(b.image.value) : null;
        if (!qid || !name) return null;
        return {
          name,
          primaryMuscle: enriched.primaryMuscle,
          equipment: enriched.equipment,
          imageUrl,
          isSystem: true,
          source: "wikidata",
          sourceId: qid,
          coachUserId: null as string | null,
        };
      })
      .filter(Boolean) as SystemExercise[];

    const remaining = maxItems - totalProcessed;
    const slice = data.slice(0, Math.max(0, remaining));

    if (slice.length === 0) break;

    let inserted = 0;
    let updated = 0;
    const concurrency = 25;
    for (let i = 0; i < slice.length; i += concurrency) {
      const chunk = slice.slice(i, i + concurrency);
      const results = await Promise.all(chunk.map((row) => upsertSystemExercise(row)));
      for (let j = 0; j < results.length; j += 1) {
        const r = results[j];
        const row = chunk[j];
        if (r.status === "inserted") inserted += 1;
        else updated += 1;
        if (row.imageUrl) {
          await ensureExerciseImage(r.id, row.imageUrl);
        }
      }
    }

    totalProcessed += slice.length;
    totalInserted += inserted;
    totalUpdated += updated;
    offset += pageSize;
    process.stdout.write(
      `offset=${offset} fetched=${bindings.length} processed=${slice.length} inserted=${inserted} updated=${updated} totals: processed=${totalProcessed} inserted=${totalInserted} updated=${totalUpdated}\n`,
    );
  }

  process.stdout.write(
    `Done. processed=${totalProcessed} inserted=${totalInserted} updated=${totalUpdated} system exercises from Wikidata.\n`,
  );
}

main()
  .catch((e) => {
    process.stderr.write(String(e instanceof Error ? e.stack ?? e.message : e));
    process.stderr.write("\n");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
