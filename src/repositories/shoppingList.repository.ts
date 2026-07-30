import { ObjectId, type Collection, type Filter, type WithId } from "mongodb";

import { database } from "../db/database";
import {
  SHOPPING_LIST_COLLECTION,
  type CreateShoppingListInput,
  type ShoppingList,
  type UpdateShoppingListInput,
} from "../entities/ShoppingList";

function collection(): Collection<ShoppingList> {
  return database.collection<ShoppingList>(SHOPPING_LIST_COLLECTION);
}

export async function findAllShoppingLists(
  filter: Filter<ShoppingList> = {},
): Promise<WithId<ShoppingList>[]> {
  return collection().find(filter).toArray();
}

/**
 * Lista de la compra de un cliente.
 * Contempla `clientId` como ObjectId o string (datos antiguos).
 */
export async function findShoppingListByClientId(
  clientId: string,
): Promise<WithId<ShoppingList> | null> {
  if (!ObjectId.isValid(clientId)) return null;
  const oid = new ObjectId(clientId);
  return collection().findOne({
    $or: [{ clientId: oid }, { clientId: clientId as unknown as ObjectId }],
  });
}

export async function findShoppingListById(
  id: string,
): Promise<WithId<ShoppingList> | null> {
  if (!ObjectId.isValid(id)) return null;
  return collection().findOne({ _id: new ObjectId(id) });
}

export async function insertShoppingList(
  data: CreateShoppingListInput,
): Promise<WithId<ShoppingList>> {
  const doc: ShoppingList = {
    ...data,
    _id: new ObjectId(),
    clientId:
      data.clientId instanceof ObjectId ? data.clientId : new ObjectId(String(data.clientId)),
  };
  await collection().insertOne(doc);
  return doc;
}

export async function updateShoppingListById(
  id: string,
  data: UpdateShoppingListInput,
): Promise<WithId<ShoppingList> | null> {
  if (!ObjectId.isValid(id)) return null;

  const update: UpdateShoppingListInput = { ...data };
  if (update.clientId !== undefined && !(update.clientId instanceof ObjectId)) {
    update.clientId = new ObjectId(String(update.clientId));
  }

  const result = await collection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );

  return result ?? null;
}

export async function deleteShoppingListById(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await collection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
