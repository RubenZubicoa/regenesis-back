import "dotenv/config";
import { run } from "./db/database";
import { migrateClientProgramRefs, seedDemoClientIfEmpty } from "./services/client.service";
import { seedDemoMeasurementsIfEmpty } from "./services/measurement.service";
import { seedDemoMeasurementMastersIfEmpty } from "./services/measurementMaster.service";
import { seedDemoProgramsIfEmpty } from "./services/program.service";
import { migrateMeasurementObjectIds } from "./repositories/measurement.repository";
import server from "./server";

const port = Number(process.env.PORT) || 3000;

async function main() {
  await run();
  await seedDemoProgramsIfEmpty();
  await seedDemoMeasurementMastersIfEmpty();
  await migrateClientProgramRefs();
  await seedDemoClientIfEmpty();
  const migrated = await migrateMeasurementObjectIds();
  if (migrated > 0) {
    console.log(`Medidas migradas a ObjectId: ${migrated}`);
  }
  await seedDemoMeasurementsIfEmpty();
  server.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
