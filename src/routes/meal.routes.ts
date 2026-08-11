import { Router } from "express";

import * as mealController from "../controllers/meal.controller";

const router = Router();

/** GET /api/meals?clientId=...  */
router.get("/", mealController.listMeals);

/** GET /api/meals/client/:clientId */
router.get("/client/:clientId", mealController.getMealByClient);

/** GET /api/meals/:id */
router.get("/:id", mealController.getMealById);

/** POST /api/meals */
router.post("/", mealController.createMeal);

/** PUT /api/meals/:id */
router.put("/:id", mealController.updateMeal);

/** DELETE /api/meals/:id */
router.delete("/:id", mealController.deleteMeal);

export default router;
