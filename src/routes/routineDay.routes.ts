import { Router } from "express";

import * as routineDayController from "../controllers/routineDay.controller";

const routineDayRoutes = Router();

routineDayRoutes.get("/", routineDayController.listRoutineDays);
routineDayRoutes.get("/:clientId", routineDayController.listRoutineDaysByClient);
routineDayRoutes.post("/", routineDayController.createRoutineDay);
routineDayRoutes.put("/:id", routineDayController.updateRoutineDay);
routineDayRoutes.delete("/:id", routineDayController.deleteRoutineDay);

export default routineDayRoutes;
