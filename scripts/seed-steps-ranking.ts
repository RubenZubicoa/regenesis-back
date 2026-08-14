/**
 * Inserta clientes demo y pasos diarios alineados con la semana/mes calendario actual.
 * Uso: npx tsx scripts/seed-steps-ranking.ts
 */
import "dotenv/config";
import { ObjectId } from "mongodb";

import { run, database, clientDB } from "../src/db/database";
import { CLIENT_COLLECTION } from "../src/entities/Client";
import { DAILY_STEPS_COLLECTION } from "../src/entities/DailySteps";
import { PROGRAM_COLLECTION } from "../src/entities/Program";
import { getCurrentWeek } from "../src/utils/programProgress";
import { startOfCalendarMonth, startOfCalendarWeek } from "../src/utils/stepsRanking";

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"] as const;

const DEMO_CLIENTS = [
  {
    name: "Ana",
    fullName: "Ana García",
    email: "ana.demo@regenesis.test",
    avatar: "https://i.pravatar.cc/100?img=32",
    weekSteps: [11240, 9850, 10320, 8760, 8420, 0, 0],
  },
  {
    name: "Marcos",
    fullName: "Marcos Ruiz",
    email: "marcos.demo@regenesis.test",
    avatar: "https://i.pravatar.cc/100?img=12",
    weekSteps: [10800, 9200, 9900, 8100, 7800, 0, 0],
  },
  {
    name: "Lucía",
    fullName: "Lucía Fernández",
    email: "lucia.demo@regenesis.test",
    avatar: "https://i.pravatar.cc/100?img=47",
    weekSteps: [10500, 10100, 9600, 8900, 8500, 0, 0],
  },
  {
    name: "Sofía",
    fullName: "Sofía Pérez",
    email: "sofia.demo@regenesis.test",
    avatar: "https://i.pravatar.cc/100?img=5",
    weekSteps: [9800, 8700, 9100, 8200, 7900, 0, 0],
  },
  {
    name: "Carlos",
    fullName: "Carlos Martín",
    email: "carlos.demo@regenesis.test",
    avatar: "https://i.pravatar.cc/100?img=15",
    weekSteps: [9200, 8400, 8800, 7600, 7200, 0, 0],
  },
];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildDays(values: number[]) {
  return DAY_LABELS.map((label, index) => ({
    label,
    value: Math.max(0, Math.round(values[index] ?? 0)),
  }));
}

async function main() {
  await run();

  const program =
    (await database.collection(PROGRAM_COLLECTION).findOne({ name: "Nutrición + Entrenamiento" })) ??
    (await database.collection(PROGRAM_COLLECTION).findOne({}));

  if (!program) {
    throw new Error("No hay programas en la base de datos");
  }

  const today = new Date();
  const monthStart = startOfCalendarMonth(today);
  const weekStart = startOfCalendarWeek(today);
  const startDate = formatDate(monthStart);
  const endDate = formatDate(addDays(monthStart, 120));
  const currentProgramWeek = getCurrentWeek(startDate, endDate, today);

  const clientsCol = database.collection(CLIENT_COLLECTION);
  const stepsCol = database.collection(DAILY_STEPS_COLLECTION);

  let clientsCreated = 0;
  let stepsUpserted = 0;

  for (const demo of DEMO_CLIENTS) {
    let client = await clientsCol.findOne({ email: demo.email });

    if (!client) {
      const doc = {
        _id: new ObjectId(),
        name: demo.name,
        fullName: demo.fullName,
        email: demo.email,
        telefono: "+34 600 000 000",
        contraseña: "regenesis123",
        goal: "Salud y actividad",
        coach: "Onatz Health Coach",
        plan: "Método Regenesis",
        program: program._id,
        startDate,
        endDate,
        week: currentProgramWeek,
        totalWeeks: getCurrentWeek(startDate, endDate, addDays(monthStart, 119)),
        phase: 1,
        totalPhases: 3,
        avatar: demo.avatar,
      };
      await clientsCol.insertOne(doc);
      client = doc;
      clientsCreated += 1;
      console.log(`Cliente creado: ${demo.fullName} (${demo.email})`);
    } else {
      await clientsCol.updateOne(
        { _id: client._id },
        {
          $set: {
            startDate,
            endDate,
            avatar: demo.avatar,
            fullName: demo.fullName,
          },
        },
      );
      console.log(`Cliente actualizado: ${demo.fullName}`);
    }

    const clientId = client._id as ObjectId;

    for (let week = 1; week <= currentProgramWeek; week += 1) {
      const weekOffset = (week - 1) * 7;
      const factor = 0.85 + week * 0.05;
      const days = buildDays(
        demo.weekSteps.map((value, dayIndex) => {
          const dayDate = addDays(monthStart, weekOffset + dayIndex);
          if (dayDate > today) return 0;
          return Math.round(value * factor);
        }),
      );

      const existing = await stepsCol.findOne({
        week,
        $or: [{ clientId }, { clientId: clientId.toHexString() as unknown as ObjectId }],
      });

      if (existing) {
        await stepsCol.updateOne({ _id: existing._id }, { $set: { days, goal: 10000, clientId } });
      } else {
        await stepsCol.insertOne({
          _id: new ObjectId(),
          clientId,
          week,
          goal: 10000,
          days,
        });
      }

      stepsUpserted += 1;
    }
  }

  // Asegura pasos también para clientes ya existentes (p. ej. Rubén)
  const existingClients = await clientsCol.find({ email: { $nin: DEMO_CLIENTS.map((c) => c.email) } }).toArray();
  for (const client of existingClients) {
    const clientId = client._id as ObjectId;
    const clientStart = String(client.startDate ?? startDate);
    const clientEnd = String(client.endDate ?? endDate);
    const week = getCurrentWeek(clientStart, clientEnd, today);

    const days = buildDays([11240, 9850, 10320, 8760, 8420, 0, 0].map((value, dayIndex) => {
      const programWeekStart = addDays(new Date(`${clientStart}T00:00:00`), (week - 1) * 7);
      const dayDate = addDays(programWeekStart, dayIndex);
      if (dayDate > today) return 0;
      return value;
    }));

    const existing = await stepsCol.findOne({
      week,
      $or: [{ clientId }, { clientId: clientId.toHexString() as unknown as ObjectId }],
    });

    if (existing) {
      await stepsCol.updateOne({ _id: existing._id }, { $set: { days, goal: 10000, clientId } });
    } else {
      await stepsCol.insertOne({
        _id: new ObjectId(),
        clientId,
        week,
        goal: 10000,
        days,
      });
    }

    stepsUpserted += 1;
    console.log(`Pasos actualizados para ${client.fullName ?? client.email}`);
  }

  console.log(
    `Listo. Clientes nuevos: ${clientsCreated}. Registros de pasos: ${stepsUpserted}. Semana calendario desde ${formatDate(weekStart)}.`,
  );
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
