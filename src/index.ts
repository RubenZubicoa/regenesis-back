import "dotenv/config";
import { run } from "./db/database";
import { migrateClientProgramRefs, seedDemoClientIfEmpty } from "./services/client.service";
import { seedDemoDailyStepsIfEmpty } from "./services/dailySteps.service";
import { seedDemoMeasurementsIfEmpty } from "./services/measurement.service";
import { seedDemoMeasurementMastersIfEmpty } from "./services/measurementMaster.service";
import { seedDemoProgramsIfEmpty } from "./services/program.service";
import { seedDemoWeightsIfEmpty } from "./services/weight.service";
import { seedDemoWellnessMastersIfEmpty } from "./services/wellnessMaster.service";
import { seedDemoWellnessIfEmpty } from "./services/wellness.service";
import { migrateMeasurementObjectIds } from "./repositories/measurement.repository";
import { migrateWellnessRefs } from "./repositories/wellness.repository";
import * as wellnessMasterRepository from "./repositories/wellnessMaster.repository";
import server from "./server";

const port = Number(process.env.PORT) || 3000;

async function main() {
  await run();
  await seedDemoProgramsIfEmpty();
  await seedDemoMeasurementMastersIfEmpty();
  await seedDemoWellnessMastersIfEmpty();
  await migrateClientProgramRefs();
  await seedDemoClientIfEmpty();
  const migrated = await migrateMeasurementObjectIds();
  if (migrated > 0) {
    console.log(`Medidas migradas a ObjectId: ${migrated}`);
  }
  await seedDemoMeasurementsIfEmpty();
  await seedDemoWeightsIfEmpty();
  const masters = await wellnessMasterRepository.findAllWellnessMasters();
  const masterByKey = Object.fromEntries(masters.map((m) => [m.key, m._id]));
  const wellnessMigrated = await migrateWellnessRefs((key) => masterByKey[key] ?? null);
  if (wellnessMigrated > 0) {
    console.log(`Registros Wellness migrados a ObjectId: ${wellnessMigrated}`);
  }
  await seedDemoWellnessIfEmpty();
  await seedDemoDailyStepsIfEmpty();
  server.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
