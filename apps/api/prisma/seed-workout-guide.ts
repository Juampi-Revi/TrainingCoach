import { seedWorkoutGuideCatalog } from "../lib/training/workout-guide-catalog";

async function main() {
  console.log("Seeding Workout Guide catalog…");
  const result = await seedWorkoutGuideCatalog();
  console.log(`Workout Guide catalog ready (created: ${result.created}, updated: ${result.updated}).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
