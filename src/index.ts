import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import { config } from './config/env.ts';
import apiRouter from './routes/index.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { db } from './prisma/db.ts';

const app: Express = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Programming Hero Job Task - Project Submission & Review API',
    status: 'ONLINE',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', apiRouter);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Gracefully shutting down server...');
  server.close(async () => {
    try {
      await db.close();
      console.log('✅ Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing database:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
