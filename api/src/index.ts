import app from './app';
import { config } from './config/env';
import { startNotificationJob } from './jobs/notifications.job';
import { logger } from './utils/logger';
import prisma from './config/database';

const PORT = config.port;

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    logger.success('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    logger.success(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Database: ${config.databaseUrl}`);
  });

  // Start scheduled notification job
  startNotificationJob();
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
