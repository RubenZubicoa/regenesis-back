import { Router } from "express";

import * as supplementsController from "../controllers/supplements.controller";

const supplementsRoutes = Router();

supplementsRoutes.get("/", supplementsController.listSupplements);
supplementsRoutes.get("/:clientId", supplementsController.getSupplementsByClient);
supplementsRoutes.post("/", supplementsController.createSupplements);
supplementsRoutes.put("/:id", supplementsController.updateSupplements);
supplementsRoutes.delete("/:id", supplementsController.deleteSupplements);

export default supplementsRoutes;
