import express, { type Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';

import { errorMiddleware } from './middlewares/error.middeware';
import clientRoutes from './routes/client.routes';
import measurementRoutes from './routes/measurement.routes';
import measurementMasterRoutes from './routes/measurementMaster.routes';
import programRoutes from './routes/program.routes';
import weightRoutes from './routes/weight.routes';
import wellnessRoutes from './routes/wellness.routes';
import wellnessMasterRoutes from './routes/wellnessMaster.routes';

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

server.use(errorMiddleware);

export default server;
