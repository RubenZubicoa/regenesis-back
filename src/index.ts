import "dotenv/config";
import { run } from "./db/database";
import { migrateClientProgramRefs } from "./services/client.service";
import { migrateRoutineExercisesToMaster } from "./services/routineDay.service";
import { migrateMeasurementObjectIds } from "./repositories/measurement.repository";
import { migrateWellnessRefs } from "./repositories/wellness.repository";
import * as wellnessMasterRepository from "./repositories/wellnessMaster.repository";
import server from "./server";

const port = Number(process.env.PORT) || 3000;

async function main() {
  await run();
  await migrateClientProgramRefs();
  const migrated = await migrateMeasurementObjectIds();
  if (migrated > 0) {
    console.log(`Medidas migradas a ObjectId: ${migrated}`);
  }
  const masters = await wellnessMasterRepository.findAllWellnessMasters();
  const masterByKey = Object.fromEntries(masters.map((m) => [m.key, m._id]));
  const wellnessMigrated = await migrateWellnessRefs((key) => masterByKey[key] ?? null);
  if (wellnessMigrated > 0) {
    console.log(`Registros Wellness migrados a ObjectId: ${wellnessMigrated}`);
  }
  const routineMigrated = await migrateRoutineExercisesToMaster();
  if (routineMigrated > 0) {
    console.log(`Ejercicios de rutina migrados a ExerciseMaster: ${routineMigrated}`);
  }
  server.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
