import { ObjectId, type WithId } from "mongodb";

import type { Client } from "../entities/Client";
import type { DailySteps } from "../entities/DailySteps";
import type { Measurement } from "../entities/Measurement";
import type { MeasurementMaster } from "../entities/MeasurementMaster";
import type {
  CreateSocialFeedInput,
  SocialFeedEntry,
  SocialFeedKind,
} from "../entities/SocialFeed";
import type { Weight } from "../entities/Weight";
import type { Wellness } from "../entities/Wellness";
import type { WellnessMaster } from "../entities/WellnessMaster";
import type { WorkoutHistory } from "../entities/WorkoutHistory";
import * as socialFeedRepository from "../repositories/socialFeed.repository";
import * as clientRepository from "../repositories/client.repository";
import * as workoutHistoryRepository from "../repositories/workoutHistory.repository";
import * as dailyStepsRepository from "../repositories/dailySteps.repository";
import { startOfCalendarWeek, sumStepsForPeriod } from "../utils/stepsRanking";

export type CommunityStats = {
  activeMembers: number;
  weeklyWorkouts: number;
  weeklySteps: number;
};

function oidToString(value: ObjectId | string): string {
  return value instanceof ObjectId ? value.toHexString() : String(value);
}

function authorFromClient(client: Pick<Client, "_id" | "fullName" | "avatar">) {
  return {
    clientId: client._id,
    fullName: client.fullName,
    avatar: client.avatar ?? "",
  };
}

/** Serializa una entrada del feed para la API (ObjectId → string). */
export function serializeSocialFeedEntry(entry: WithId<SocialFeedEntry>): Record<string, unknown> {
  const base = {
    _id: entry._id.toHexString(),
    clientId: oidToString(entry.clientId),
    author: {
      clientId: oidToString(entry.author.clientId),
      fullName: entry.author.fullName,
      avatar: entry.author.avatar,
    },
    createdAt: entry.createdAt.toISOString(),
    likes: entry.likes,
    comments: entry.comments,
    kind: entry.kind,
    ...(entry.sourceId ? { sourceId: entry.sourceId.toHexString() } : {}),
  };

  switch (entry.kind) {
    case "workout":
      return {
        ...base,
        workoutHistoryId: entry.workoutHistoryId.toHexString(),
        week: entry.week,
        day: entry.day,
        focus: entry.focus,
        duration: entry.duration,
        durationMinutes: entry.durationMinutes,
        exerciseCount: entry.exerciseCount,
        ...(entry.media?.length ? { media: entry.media } : {}),
      };
    case "weight":
      return {
        ...base,
        weightId: entry.weightId.toHexString(),
        label: entry.label,
        previousKg: entry.previousKg,
        currentKg: entry.currentKg,
        unit: entry.unit,
      };
    case "measurement":
      return {
        ...base,
        measurementId: entry.measurementId.toHexString(),
        MeasurementId: entry.MeasurementId.toHexString(),
        label: entry.label,
        unit: entry.unit,
        value: entry.value,
        delta: entry.delta,
        date: entry.date,
      };
    case "steps":
      return {
        ...base,
        dailyStepsId: entry.dailyStepsId.toHexString(),
        week: entry.week,
        dayLabel: entry.dayLabel,
        steps: entry.steps,
        goal: entry.goal,
      };
    case "wellness":
      return {
        ...base,
        date: entry.date,
        items: entry.items.map((item) => ({
          wellnessId: item.wellnessId.toHexString(),
          masterId: item.masterId.toHexString(),
          key: item.key,
          label: item.label,
          value: item.value,
        })),
      };
    case "photos":
      return {
        ...base,
        week: entry.week,
        photos: entry.photos,
      };
    case "challenge":
      return {
        ...base,
        title: entry.title,
        completedDays: entry.completedDays,
        totalDays: entry.totalDays,
        completed: entry.completed,
      };
    default:
      return base;
  }
}

export async function listSocialFeed(kind?: SocialFeedKind, limit = 100) {
  const entries = await socialFeedRepository.findSocialFeedByKind(kind, limit);
  return entries.map(serializeSocialFeedEntry);
}

async function upsertBySource(input: CreateSocialFeedInput & { sourceId: ObjectId }) {
  const existing = await socialFeedRepository.findSocialFeedBySource(
    input.kind,
    input.sourceId.toHexString(),
  );

  if (existing) {
    const updated = await socialFeedRepository.updateSocialFeedById(existing._id.toHexString(), {
      ...input,
      createdAt: new Date(),
    } as Partial<SocialFeedEntry>);
    return updated ?? existing;
  }

  return socialFeedRepository.insertSocialFeed(input);
}

export async function publishWorkout(
  client: Pick<Client, "_id" | "fullName" | "avatar">,
  workout: WithId<WorkoutHistory>,
) {
  const input: CreateSocialFeedInput = {
    kind: "workout",
    clientId: client._id,
    author: authorFromClient(client),
    sourceId: workout._id,
    workoutHistoryId: workout._id,
    week: workout.week,
    day: workout.day,
    focus: workout.focus,
    duration: workout.duration,
    durationMinutes: workout.durationMinutes,
    exerciseCount: workout.exercises.length,
    ...(workout.media?.length ? { media: workout.media } : {}),
  };

  return upsertBySource(input as CreateSocialFeedInput & { sourceId: ObjectId });
}

export async function publishWeight(
  client: Pick<Client, "_id" | "fullName" | "avatar">,
  weight: WithId<Weight>,
  input: { label: string; previousKg: number; currentKg: number },
) {
  const sourceId = ObjectId.createFromHexString(
    createDeterministicObjectIdHex(`${weight._id.toHexString()}:${input.label}`),
  );

  const feedInput: CreateSocialFeedInput = {
    kind: "weight",
    clientId: client._id,
    author: authorFromClient(client),
    sourceId,
    weightId: weight._id,
    label: input.label,
    previousKg: input.previousKg,
    currentKg: input.currentKg,
    unit: weight.unit || "kg",
  };

  return upsertBySource(feedInput as CreateSocialFeedInput & { sourceId: ObjectId });
}

export async function publishMeasurement(
  client: Pick<Client, "_id" | "fullName" | "avatar">,
  measurement: WithId<Measurement>,
  master: Pick<MeasurementMaster, "label" | "unit">,
) {
  const input: CreateSocialFeedInput = {
    kind: "measurement",
    clientId: client._id,
    author: authorFromClient(client),
    sourceId: measurement._id,
    measurementId: measurement._id,
    MeasurementId: measurement.MeasurementId,
    label: master.label,
    unit: master.unit,
    value: measurement.value,
    delta: measurement.delta,
    date: measurement.date,
  };

  return upsertBySource(input as CreateSocialFeedInput & { sourceId: ObjectId });
}

export async function publishSteps(
  client: Pick<Client, "_id" | "fullName" | "avatar">,
  dailySteps: WithId<DailySteps>,
  input: { dayLabel: string; steps: number },
) {
  const sourceKey = `${dailySteps._id.toHexString()}:${input.dayLabel}`;
  const sourceId = ObjectId.createFromHexString(
    createDeterministicObjectIdHex(sourceKey),
  );

  const feedInput: CreateSocialFeedInput = {
    kind: "steps",
    clientId: client._id,
    author: authorFromClient(client),
    sourceId,
    dailyStepsId: dailySteps._id,
    week: dailySteps.week,
    dayLabel: input.dayLabel,
    steps: input.steps,
    goal: dailySteps.goal,
  };

  return upsertBySource(feedInput as CreateSocialFeedInput & { sourceId: ObjectId });
}

export async function publishWellness(
  client: Pick<Client, "_id" | "fullName" | "avatar">,
  record: WithId<Wellness>,
  master: Pick<WellnessMaster, "_id" | "key" | "label">,
) {
  const date = record.date.toISOString().slice(0, 10);
  const existing = await socialFeedRepository.findWellnessFeedByClientAndDate(
    client._id.toHexString(),
    date,
  );

  const item = {
    wellnessId: record._id,
    masterId: master._id,
    key: master.key,
    label: master.label,
    value: record.value,
  };

  if (existing && existing.kind === "wellness") {
    const items = [...existing.items];
    const index = items.findIndex((row) => row.masterId.toHexString() === master._id.toHexString());
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }

    const updated = await socialFeedRepository.updateSocialFeedById(existing._id.toHexString(), {
      items,
      createdAt: new Date(),
    } as Partial<SocialFeedEntry>);
    return updated ?? existing;
  }

  return socialFeedRepository.insertSocialFeed({
    kind: "wellness",
    clientId: client._id,
    author: authorFromClient(client),
    date,
    items: [item],
  });
}

/** Genera un ObjectId determinista de 24 hex chars a partir de un texto. */
function createDeterministicObjectIdHex(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const part = hash.toString(16).padStart(8, "0");
  return `${part}${part}${part}`.slice(0, 24);
}

export async function seedDemoSocialFeedIfEmpty() {
  const count = await socialFeedRepository.countSocialFeed();
  if (count > 0) return;

  console.log("SocialFeed: sin seed automático (se publica al compartir logros)");
}

function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Resumen numérico para la cabecera de Comunidad. */
export async function getCommunityStats(refDate = new Date()): Promise<CommunityStats> {
  const weekStartIso = formatIsoDate(startOfCalendarWeek(refDate));

  const [activeMembers, weeklyWorkouts, clients, allStepsRecords] = await Promise.all([
    clientRepository.countClients(),
    workoutHistoryRepository.countWorkoutsSinceDate(weekStartIso),
    clientRepository.findAllClients(),
    dailyStepsRepository.findAllDailySteps(),
  ]);

  const recordsByClient = new Map<string, typeof allStepsRecords>();
  for (const record of allStepsRecords) {
    const clientId =
      record.clientId instanceof ObjectId
        ? record.clientId.toHexString()
        : String(record.clientId);
    const list = recordsByClient.get(clientId) ?? [];
    list.push(record);
    recordsByClient.set(clientId, list);
  }

  let weeklySteps = 0;
  for (const client of clients) {
    const clientId = client._id.toHexString();
    const records = recordsByClient.get(clientId) ?? [];
    weeklySteps += sumStepsForPeriod(client.startDate, records, "week", refDate);
  }

  return { activeMembers, weeklyWorkouts, weeklySteps };
}
