/**
 * enrich-exercise-images.ts
 *
 * Fetches Wikipedia thumbnail images for system exercises that currently
 * have no media. Uses the Wikipedia REST API (page/summary endpoint) which
 * returns a thumbnail URL without any auth or rate-limit concerns.
 *
 * Usage:
 *   npx tsx scripts/enrich-exercise-images.ts
 *
 * Env vars (all optional):
 *   DRY_RUN=1   — print what would be saved without writing to DB
 *   WP_LANG=es  — Wikipedia language (default: "en")
 */

import { prisma } from "../lib/prisma";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const EXERCISE_KEYWORDS = [
  "exercise", "workout", "muscle", "strength", "training", "physical fitness",
  "weight lifting", "weightlifting", "bodybuilding", "calisthenics", "resistance",
  "gym", "barbell", "dumbbell", "kettlebell", "press", "curl", "squat", "deadlift",
  "pull-up", "push-up", "lunge", "plank", "row", "lift", "extension", "flexion",
];

function isExerciseDescription(description: string | undefined): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  return EXERCISE_KEYWORDS.some((kw) => lower.includes(kw));
}

async function fetchWikipediaThumbnail(
  title: string,
  lang = "en",
): Promise<string | null> {
  const encoded = encodeURIComponent(title.replace(/ /g, "_"));
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "training-challenge-recomposition/1.0 (enrich-exercise-images; contact: admin)",
        Accept: "application/json",
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as {
      thumbnail?: { source?: string };
      originalimage?: { source?: string };
      description?: string;
    };
    // Reject pages that are clearly not about a fitness exercise
    if (!isExerciseDescription(json.description)) return null;
    // Prefer originalimage (higher quality) but fall back to thumbnail
    return json.originalimage?.source ?? json.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

/**
 * Try multiple title variants for an exercise name.
 * Returns the first URL found, or null.
 */
async function findImageForExercise(name: string, lang: string): Promise<string | null> {
  const variants: string[] = [
    name, // exact
    name.replace(/-/g, " "), // "Pull-up" → "Pull up"
    name.charAt(0).toUpperCase() + name.slice(1), // capitalize first
    // split on parentheses: "Dip (exercise)" is a common WP disambiguation
    `${name} (exercise)`,
    `${name} (weight training)`,
  ];

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const deduped = variants.filter((v) => {
    const k = v.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  for (const title of deduped) {
    const url = await fetchWikipediaThumbnail(title, lang);
    if (url) return url;
    await sleep(120); // be polite
  }
  return null;
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const lang = process.env.WP_LANG ?? "en";

  if (dryRun) {
    process.stdout.write("DRY_RUN mode — no DB writes\n");
  }

  // Load all system exercises that currently have no media
  const exercises = await prisma.exercise.findMany({
    where: {
      isSystem: true,
      media: { none: {} },
    },
    select: { id: true, name: true, primaryMuscle: true },
    orderBy: { name: "asc" },
  });

  process.stdout.write(
    `Found ${exercises.length} system exercises without images.\n`,
  );

  let enriched = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const url = await findImageForExercise(ex.name, lang);
    if (!url) {
      process.stdout.write(`  MISS  ${ex.name}\n`);
      skipped += 1;
      continue;
    }

    process.stdout.write(`  HIT   ${ex.name}\n        ${url}\n`);

    if (!dryRun) {
      // idempotent: don't create a duplicate if the URL already exists
      const exists = await prisma.exerciseMedia.findFirst({
        where: { exerciseId: ex.id, url },
        select: { id: true },
      });
      if (!exists) {
        await prisma.exerciseMedia.create({
          data: { exerciseId: ex.id, mediaType: "image", url },
          select: { id: true },
        });
      }
    }

    enriched += 1;
    // Small pause between exercises to be respectful to WP servers
    await sleep(200);
  }

  process.stdout.write(
    `\nDone. enriched=${enriched} skipped=${skipped} total=${exercises.length}\n`,
  );
}

main()
  .catch((e) => {
    process.stderr.write(
      String(e instanceof Error ? e.stack ?? e.message : e),
    );
    process.stderr.write("\n");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
