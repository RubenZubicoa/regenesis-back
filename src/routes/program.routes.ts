import { Router } from "express";

import * as programController from "../controllers/program.controller";

const programRoutes = Router();

programRoutes.get("/", programController.listPrograms);
programRoutes.get("/:id", programController.getProgram);
programRoutes.post("/", programController.createProgram);
programRoutes.put("/:id", programController.updateProgram);
programRoutes.delete("/:id", programController.deleteProgram);

export default programRoutes;
