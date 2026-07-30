import { Router } from "express";

import * as macrosController from "../controllers/macros.controller";

const macrosRoutes = Router();

macrosRoutes.get("/", macrosController.listMacros);
macrosRoutes.get("/:clientId", macrosController.getMacrosByClient);
macrosRoutes.post("/", macrosController.createMacros);
macrosRoutes.put("/:id", macrosController.updateMacros);
macrosRoutes.delete("/:id", macrosController.deleteMacros);

export default macrosRoutes;
