import { Router } from "express";

import * as weightController from "../controllers/weight.controller";

const weightRoutes = Router();

weightRoutes.get("/", weightController.listWeights);
weightRoutes.get("/:id", weightController.getWeight);
weightRoutes.post("/", weightController.createWeight);
weightRoutes.put("/:id", weightController.updateWeight);
weightRoutes.delete("/:id", weightController.deleteWeight);

export default weightRoutes;
