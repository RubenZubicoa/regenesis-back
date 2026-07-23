import { Router } from "express";

import * as clientController from "../controllers/client.controller";
import * as measurementController from "../controllers/measurement.controller";
import * as weightController from "../controllers/weight.controller";

const clientRoutes = Router();

clientRoutes.get("/", clientController.listClients);
clientRoutes.post("/login", clientController.loginClient);
clientRoutes.get("/:id/measurements", measurementController.listMeasurementsByClient);
clientRoutes.get("/:id/weights", weightController.getWeightByClient);
clientRoutes.get("/:id", clientController.getClient);
clientRoutes.post("/", clientController.createClient);
clientRoutes.put("/:id", clientController.updateClient);
clientRoutes.delete("/:id", clientController.deleteClient);

export default clientRoutes;
