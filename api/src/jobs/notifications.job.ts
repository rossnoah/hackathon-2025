import cron from 'node-cron';
import expo from '../config/expo';
import { Expo } from 'expo-server-sdk';
import userService from '../services/user.service';
import assignmentService from '../services/assignment.service';
import aiService from '../services/ai.service';
import { logger } from '../utils/logger';

export function startNotificationJob() {
  // Scheduled job to send reminders every 60 seconds
  cron.schedule('*/1 * * * *', async () => {
    logger.info('🔔 Running scheduled notification job...');

    try {
      // Get all users with push tokens AND notifications enabled
      const users = await userService.getUsersWithPushTokens(true);

      for (const user of users) {
        // Get assignments for this user
        const assignments = await assignmentService.getAssignmentsByEmail(user.email);

        // Only send if user has assignments
        if (assignments.length === 0) {
          logger.info(`Skipping ${user.email} - no assignments`);
          continue;
        }

        // Generate personalized notification with screentime context
        const notificationBody = await aiService.generateDuolingoNotification(
          assignments,
          user.email
        );

        // Send notification
        if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
          try {
            await expo.sendPushNotificationsAsync([
              {
                to: user.pushToken,
                sound: 'default',
                title: 'Blinky',
                body: notificationBody,
                data: {
                  type: 'reminder',
                  assignmentCount: assignments.length,
                  email: user.email,
                },
              },
            ]);
            logger.success(
              `Sent notification to ${user.email}: "${notificationBody}"`
            );
          } catch (error) {
            logger.error(`Error sending to ${user.email}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Error in scheduled job:', error);
    }
  });

  logger.info('📬 Scheduled notifications running every 60 seconds');
}
