import { Router } from "express";

import * as trainerController from "../controllers/trainer.controller";

const trainerRoutes = Router();

trainerRoutes.post("/login", trainerController.loginTrainer);
trainerRoutes.post("/", trainerController.createTrainer);

export default trainerRoutes;
