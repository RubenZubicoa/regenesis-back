import { Router } from "express";

import * as wellnessMasterController from "../controllers/wellnessMaster.controller";

const wellnessMasterRoutes = Router();

wellnessMasterRoutes.get("/", wellnessMasterController.listWellnessMasters);
wellnessMasterRoutes.get("/:id", wellnessMasterController.getWellnessMaster);
wellnessMasterRoutes.post("/", wellnessMasterController.createWellnessMaster);
wellnessMasterRoutes.put("/:id", wellnessMasterController.updateWellnessMaster);
wellnessMasterRoutes.delete("/:id", wellnessMasterController.deleteWellnessMaster);

export default wellnessMasterRoutes;
