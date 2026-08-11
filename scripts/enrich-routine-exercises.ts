/**
 * Rellena name/type/imageUrl/explanation en RoutineDay.exercises
 * a partir de ExerciseMaster (compatibilidad con API aún no desplegada).
 * Conserva exerciseId.
 *
 * Uso: npx tsx scripts/enrich-routine-exercises.ts
 */
import "dotenv/config";
import { ObjectId } from "mongodb";

import { run, database, clientDB } from "../src/db/database";
import { EXERCISE_MASTER_COLLECTION } from "../src/entities/ExerciseMaster";
import { ROUTINE_DAY_COLLECTION } from "../src/entities/RoutineDay";

async function main() {
  await run();

  const masters = await database.collection(EXERCISE_MASTER_COLLECTION).find({}).toArray();
  const byId = new Map(masters.map((m) => [String(m._id), m]));

  const days = await database.collection(ROUTINE_DAY_COLLECTION).find({}).toArray();
  let updatedDays = 0;
  let updatedExercises = 0;

  for (const day of days) {
    const exercises = Array.isArray(day.exercises) ? day.exercises : [];
    let changed = false;

    const next = exercises.map((ex: Record<string, unknown>) => {
      const id = ex.exerciseId ? String(ex.exerciseId) : "";
      const master = id ? byId.get(id) : undefined;
      if (!master) return ex;

      changed = true;
      updatedExercises += 1;
      return {
        exerciseId:
          ex.exerciseId instanceof ObjectId ? ex.exerciseId : new ObjectId(id),
        sets: ex.sets,
        rest: ex.rest,
        ...(ex.seriesCount !== undefined ? { seriesCount: ex.seriesCount } : {}),
        ...(ex.repRange ? { repRange: ex.repRange } : {}),
        ...(ex.repUnit ? { repUnit: ex.repUnit } : {}),
        ...(ex.targetKm !== undefined ? { targetKm: ex.targetKm } : {}),
        // Campos denormalizados para APIs antiguas / fallback
        name: master.name,
        type: master.type,
        ...(master.imageUrl ? { imageUrl: master.imageUrl } : {}),
        ...(master.explanation ? { explanation: master.explanation } : {}),
      };
    });

    if (changed) {
      await database
        .collection(ROUTINE_DAY_COLLECTION)
        .updateOne({ _id: day._id }, { $set: { exercises: next } });
      updatedDays += 1;
      console.log(`Enriquecido ${day.day ?? day._id}`);
    }
  }

  console.log(`Listo. Días: ${updatedDays}, ejercicios: ${updatedExercises}`);
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
