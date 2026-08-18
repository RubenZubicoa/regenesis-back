import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  SOCIAL_FEED_COLLECTION,
  type CreateSocialFeedInput,
  type SocialFeedEntry,
  type SocialFeedKind,
} from "../entities/SocialFeed";

function collection(): Collection<SocialFeedEntry> {
  return database.collection<SocialFeedEntry>(SOCIAL_FEED_COLLECTION);
}

export async function findSocialFeed(
  filter: Filter<SocialFeedEntry> = {},
  limit = 100,
): Promise<WithId<SocialFeedEntry>[]> {
  return collection().find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
}

export async function findSocialFeedByKind(
  kind?: SocialFeedKind,
  limit = 100,
): Promise<WithId<SocialFeedEntry>[]> {
  const filter = kind ? { kind } : {};
  return findSocialFeed(filter, limit);
}

export async function findSocialFeedBySource(
  kind: SocialFeedKind,
  sourceId: string,
): Promise<WithId<SocialFeedEntry> | null> {
  if (!ObjectId.isValid(sourceId)) return null;
  return collection().findOne({
    kind,
    sourceId: new ObjectId(sourceId),
  });
}

export async function findWellnessFeedByClientAndDate(
  clientId: string,
  date: string,
): Promise<WithId<SocialFeedEntry> | null> {
  if (!ObjectId.isValid(clientId)) return null;
  const oid = new ObjectId(clientId);
  return collection().findOne({
    kind: "wellness",
    date,
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function insertSocialFeed(
  data: CreateSocialFeedInput,
): Promise<WithId<SocialFeedEntry>> {
  const doc = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
    createdAt: data.createdAt ?? new Date(),
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    author: {
      ...data.author,
      clientId:
        data.author.clientId instanceof ObjectId
          ? data.author.clientId
          : new ObjectId(String(data.author.clientId)),
    },
  } as SocialFeedEntry;

  if (doc.sourceId && !(doc.sourceId instanceof ObjectId)) {
    doc.sourceId = new ObjectId(String(doc.sourceId));
  }

  await collection().insertOne(doc);
  return doc as WithId<SocialFeedEntry>;
}

export async function updateSocialFeedById(
  id: string,
  data: Partial<SocialFeedEntry>,
): Promise<WithId<SocialFeedEntry> | null> {
  if (!ObjectId.isValid(id)) return null;
  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function deleteSocialFeedById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function countSocialFeed(): Promise<number> {
  return collection().countDocuments();
}

export async function findSocialFeedSince(
  since: Date,
): Promise<WithId<SocialFeedEntry>[]> {
  return collection()
    .find({ createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .toArray();
}
