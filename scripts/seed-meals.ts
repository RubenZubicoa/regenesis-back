/**
 * Inserta (o actualiza) el plan de comidas demo para todos los clientes.
 * Uso: npx tsx scripts/seed-meals.ts
 */
import "dotenv/config";
import { ObjectId } from "mongodb";

import { run, database, clientDB } from "../src/db/database";
import { MEAL_COLLECTION } from "../src/entities/Meal";
import { CLIENT_COLLECTION } from "../src/entities/Client";
import { DEMO_SLOTS } from "../src/services/meal.service";

async function main() {
  await run();

  const clients = await database.collection(CLIENT_COLLECTION).find({}).toArray();
  if (clients.length === 0) {
    throw new Error("No hay clientes en la base de datos");
  }

  const mealsCol = database.collection(MEAL_COLLECTION);
  let inserted = 0;
  let updated = 0;

  for (const client of clients) {
    const clientId = client._id as ObjectId;
    const existing = await mealsCol.findOne({
      $or: [{ clientId }, { clientId: clientId.toHexString() as unknown as ObjectId }],
    });

    if (existing) {
      await mealsCol.updateOne(
        { _id: existing._id },
        { $set: { slots: DEMO_SLOTS, clientId }, $unset: { items: "" } },
      );
      updated += 1;
      console.log(`Actualizado Meal para ${client.email ?? clientId.toHexString()}`);
    } else {
      await mealsCol.insertOne({
        _id: new ObjectId(),
        clientId,
        slots: DEMO_SLOTS,
      });
      inserted += 1;
      console.log(`Insertado Meal para ${client.email ?? clientId.toHexString()}`);
    }
  }

  console.log(`Listo. Insertados: ${inserted}, actualizados: ${updated}`);
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
