import { Router } from "express";

import * as clientController from "../controllers/client.controller";

const clientRoutes = Router();

clientRoutes.get("/", clientController.listClients);
clientRoutes.post("/login", clientController.loginClient);
clientRoutes.get("/:id", clientController.getClient);
clientRoutes.post("/", clientController.createClient);
clientRoutes.put("/:id", clientController.updateClient);
clientRoutes.delete("/:id", clientController.deleteClient);

export default clientRoutes;
