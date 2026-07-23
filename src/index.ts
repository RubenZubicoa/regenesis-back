import "dotenv/config";
import { run } from "./db/database";
import { seedDemoClientIfEmpty } from "./services/client.service";
import server from "./server";

const port = Number(process.env.PORT) || 3000;

async function main() {
  await run();
  await seedDemoClientIfEmpty();
  server.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
