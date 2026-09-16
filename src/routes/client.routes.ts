import { Router } from "express";

import * as clientController from "../controllers/client.controller";
import * as measurementController from "../controllers/measurement.controller";
import * as weightController from "../controllers/weight.controller";
import { uploadClientAvatar } from "../middlewares/upload.middleware";

const clientRoutes = Router();

clientRoutes.get("/", clientController.listClients);
clientRoutes.post("/login", clientController.loginClient);
clientRoutes.get("/:id/measurements", measurementController.listMeasurementsByClient);
clientRoutes.get("/:id/weights", weightController.getWeightByClient);
clientRoutes.get("/:id", clientController.getClient);
clientRoutes.post("/", uploadClientAvatar, clientController.createClient);
clientRoutes.put("/:id", uploadClientAvatar, clientController.updateClient);
clientRoutes.delete("/:id", clientController.deleteClient);

export default clientRoutes;
