import { Router } from "express";

import * as shoppingListController from "../controllers/shoppingList.controller";

const shoppingListRoutes = Router();

shoppingListRoutes.get("/", shoppingListController.listShoppingLists);
shoppingListRoutes.get("/:clientId", shoppingListController.getShoppingListByClient);
shoppingListRoutes.post("/", shoppingListController.createShoppingList);
shoppingListRoutes.put("/:id", shoppingListController.updateShoppingList);
shoppingListRoutes.delete("/:id", shoppingListController.deleteShoppingList);

export default shoppingListRoutes;
