import "dotenv/config";
import { run } from "./db/database";
import { migrateClientProgramRefs, seedDemoClientIfEmpty } from "./services/client.service";
import { seedDemoProgramsIfEmpty } from "./services/program.service";
import server from "./server";

const port = Number(process.env.PORT) || 3000;

async function main() {
  await run();
  await seedDemoProgramsIfEmpty();
  await migrateClientProgramRefs();
  await seedDemoClientIfEmpty();
  server.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
