import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use(routes);

// Serve dashboard as home page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
