import { Router } from "express";

import * as specController from "../controllers/technicalSpecifications.controller";

const router = Router();

router.get("/", specController.listSpecs);
router.get("/client/:clientId", specController.getSpecByClient);
router.get("/:id", specController.getSpecById);
router.post("/", specController.createSpec);
router.put("/:id", specController.updateSpec);
router.delete("/:id", specController.deleteSpec);

export default router;
