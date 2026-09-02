import { ObjectId, type Collection, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  VIDEO_LIBRARY_COLLECTION,
  type CreateVideoLibraryInput,
  type UpdateVideoLibraryInput,
  type VideoLibraryCategory,
} from "../entities/VideoLibrary";

function collection(): Collection<VideoLibraryCategory> {
  return database.collection<VideoLibraryCategory>(VIDEO_LIBRARY_COLLECTION);
}

function filterItemsByPhase(
  docs: WithId<VideoLibraryCategory>[],
  phase: number,
): WithId<VideoLibraryCategory>[] {
  return docs
    .map((doc) => ({
      ...doc,
      items: (doc.items ?? []).filter((item) => item.phase === phase),
    }))
    .filter((doc) => doc.items.length > 0);
}

export async function findAllVideoLibraries(
  phase?: number,
): Promise<WithId<VideoLibraryCategory>[]> {
  const filter = phase !== undefined ? { "items.phase": phase } : {};
  const docs = await collection().find(filter).sort({ category: 1 }).toArray();
  if (phase === undefined) return docs;
  return filterItemsByPhase(docs, phase);
}

export async function findVideoLibraryById(
  id: string,
  phase?: number,
): Promise<WithId<VideoLibraryCategory> | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await collection().findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  if (phase === undefined) return doc;
  return {
    ...doc,
    items: (doc.items ?? []).filter((item) => item.phase === phase),
  };
}

export async function findVideoLibraryByCategory(
  category: string,
): Promise<WithId<VideoLibraryCategory> | null> {
  const trimmed = category.trim();
  if (!trimmed) return null;
  return collection().findOne({
    category: { $regex: `^${trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });
}

export async function insertVideoLibrary(
  data: CreateVideoLibraryInput,
): Promise<WithId<VideoLibraryCategory>> {
  const doc: VideoLibraryCategory = {
    ...data,
    _id: new ObjectId(),
    category: data.category.trim(),
    icon: data.icon.trim(),
    tone: data.tone,
    items: data.items ?? [],
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateVideoLibraryById(
  id: string,
  data: UpdateVideoLibraryInput,
): Promise<WithId<VideoLibraryCategory> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateVideoLibraryInput = { ...data };
  if (typeof update.category === "string") update.category = update.category.trim();
  if (typeof update.icon === "string") update.icon = update.icon.trim();

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteVideoLibraryById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
