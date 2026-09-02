import { Router } from "express";

import * as exerciseCategoryController from "../controllers/exerciseCategory.controller";

const exerciseCategoryRoutes = Router();

exerciseCategoryRoutes.get("/", exerciseCategoryController.listExerciseCategories);
exerciseCategoryRoutes.get("/:id", exerciseCategoryController.getExerciseCategory);
exerciseCategoryRoutes.post("/", exerciseCategoryController.createExerciseCategory);
exerciseCategoryRoutes.put("/:id", exerciseCategoryController.updateExerciseCategory);
exerciseCategoryRoutes.delete("/:id", exerciseCategoryController.deleteExerciseCategory);

export default exerciseCategoryRoutes;
