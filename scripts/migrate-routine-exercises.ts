/**
 * Ejecuta seed de ExerciseMaster + migración de RoutineDay a exerciseId.
 * Uso: npx tsx scripts/migrate-routine-exercises.ts
 */
import "dotenv/config";

import { run, clientDB } from "../src/db/database";
import { seedDemoExerciseMastersIfEmpty } from "../src/services/exerciseMaster.service";
import { migrateRoutineExercisesToMaster } from "../src/services/routineDay.service";

async function main() {
  await run();
  const masters = await seedDemoExerciseMastersIfEmpty();
  console.log(`ExerciseMasters: ${masters?.length ?? "ya existían"}`);
  const migrated = await migrateRoutineExercisesToMaster();
  console.log(`Ejercicios migrados: ${migrated}`);
  await clientDB.close();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await clientDB.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
