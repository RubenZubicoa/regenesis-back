import { Router } from "express";

import * as mealMasterController from "../controllers/mealMaster.controller";

const mealMasterRoutes = Router();

mealMasterRoutes.get("/", mealMasterController.listMealMasters);
mealMasterRoutes.get("/:id", mealMasterController.getMealMaster);
mealMasterRoutes.post("/", mealMasterController.createMealMaster);
mealMasterRoutes.put("/:id", mealMasterController.updateMealMaster);
mealMasterRoutes.delete("/:id", mealMasterController.deleteMealMaster);

export default mealMasterRoutes;
