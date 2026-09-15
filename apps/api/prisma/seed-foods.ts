import { seedSystemFoods } from "../lib/health/food-catalog.service";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding food catalog…");
  const result = await seedSystemFoods();
  console.log(`Food catalog ready (created: ${result.created}, updated: ${result.updated}, total: ${result.total}).`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
