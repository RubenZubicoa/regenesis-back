import { ObjectId } from "mongodb";

export const SHOPPING_LIST_COLLECTION = "ShoppingList";

export interface ShoppingListItem {
  item: string;
  qty: string;
  done: boolean;
}

export interface ShoppingList {
  _id: ObjectId;
  /** Id del cliente (colección Client). */
  clientId: ObjectId;
  list: ShoppingListItem[];
}

/** Datos para crear una lista de la compra (sin `_id`). */
export type CreateShoppingListInput = Omit<ShoppingList, "_id">;

/** Datos parciales para actualizar una lista de la compra. */
export type UpdateShoppingListInput = Partial<CreateShoppingListInput>;
