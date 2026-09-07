import { Router } from "express";

import * as routineMasterController from "../controllers/routineMaster.controller";

const routineMasterRoutes = Router();

routineMasterRoutes.get("/", routineMasterController.listRoutineMasters);
routineMasterRoutes.get("/:id", routineMasterController.getRoutineMaster);
routineMasterRoutes.post("/", routineMasterController.createRoutineMaster);
routineMasterRoutes.put("/:id", routineMasterController.updateRoutineMaster);
routineMasterRoutes.delete("/:id", routineMasterController.deleteRoutineMaster);

export default routineMasterRoutes;
