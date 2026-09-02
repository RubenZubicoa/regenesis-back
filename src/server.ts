import express, { type Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';

import { errorMiddleware } from './middlewares/error.middeware';
import clientRoutes from './routes/client.routes';
import dailyStepsRoutes from './routes/dailySteps.routes';
import macrosRoutes from './routes/macros.routes';
import measurementRoutes from './routes/measurement.routes';
import measurementMasterRoutes from './routes/measurementMaster.routes';
import programRoutes from './routes/program.routes';
import routineDayRoutes from './routes/routineDay.routes';
import shoppingListRoutes from './routes/shoppingList.routes';
import supplementsRoutes from './routes/supplements.routes';
import weightRoutes from './routes/weight.routes';
import wellnessRoutes from './routes/wellness.routes';
import wellnessMasterRoutes from './routes/wellnessMaster.routes';
import mealRoutes from './routes/meal.routes';
import exerciseCategoryRoutes from './routes/exerciseCategory.routes';
import exerciseMasterRoutes from './routes/exerciseMaster.routes';
import workoutHistoryRoutes from './routes/workoutHistory.routes';
import socialFeedRoutes from './routes/socialFeed.routes';
import reviewRoutes from './routes/review.routes';
import progressImageRoutes from './routes/progressImage.routes';

const server: Application = express();

// Middlewares

server.use(morgan('dev'));
server.use(cors());

// No parsear multipart aquí: multer necesita el stream intacto
server.use((req, res, next) => {
  if (req.is('multipart/form-data')) return next();
  express.json({ limit: '10mb' })(req, res, next);
});
server.use((req, res, next) => {
  if (req.is('multipart/form-data')) return next();
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

server.use("/uploads", express.static("uploads"));

// public routes
server.use("/api/clients", clientRoutes);
server.use("/api/programs", programRoutes);
server.use("/api/measurement-masters", measurementMasterRoutes);
server.use("/api/measurements", measurementRoutes);
server.use("/api/weights", weightRoutes);
server.use("/api/wellness-masters", wellnessMasterRoutes);
server.use("/api/wellness", wellnessRoutes);
server.use("/api/daily-steps", dailyStepsRoutes);
server.use("/api/shopping-lists", shoppingListRoutes);
server.use("/api/macros", macrosRoutes);
server.use("/api/meals", mealRoutes);
server.use("/api/supplements", supplementsRoutes);
server.use("/api/exercise-categories", exerciseCategoryRoutes);
server.use("/api/exercise-masters", exerciseMasterRoutes);
server.use("/api/routine-days", routineDayRoutes);
server.use("/api/workout-history", workoutHistoryRoutes);
server.use("/api/social-feed", socialFeedRoutes);
server.use("/api/reviews", reviewRoutes);
server.use("/api/progress-images", progressImageRoutes);

server.use(errorMiddleware);

export default server;
