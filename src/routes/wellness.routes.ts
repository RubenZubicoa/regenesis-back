import { Router } from "express";

import * as wellnessController from "../controllers/wellness.controller";

const wellnessRoutes = Router();

wellnessRoutes.get("/", wellnessController.listWellness);
wellnessRoutes.get("/:clientId", wellnessController.listWellnessByClient);
wellnessRoutes.post("/", wellnessController.createWellness);
wellnessRoutes.put("/:id", wellnessController.updateWellness);
wellnessRoutes.delete("/:id", wellnessController.deleteWellness);

export default wellnessRoutes;
