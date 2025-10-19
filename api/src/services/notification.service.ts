import expo from '../config/expo';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { NotificationInput } from '../types';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export class NotificationService {
  async sendNotification(input: NotificationInput) {
    const { title, body, data, email } = input;

    // Get push tokens from database
    let users;
    if (email) {
      users = await prisma.user.findMany({
        where: {
          email,
          pushToken: { not: null },
        },
        select: { pushToken: true },
      });
    } else {
      users = await prisma.user.findMany({
        where: { pushToken: { not: null } },
        select: { pushToken: true },
      });
    }

    if (users.length === 0) {
      throw new Error('No registered push tokens found');
    }

    // Create the messages
    const messages: ExpoPushMessage[] = [];
    for (const user of users) {
      const pushToken = user.pushToken;

      if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
        logger.error(`Invalid push token: ${pushToken}`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
      });
    }

    // Send the notifications in chunks
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    return {
      success: true,
      count: messages.length,
      tickets,
    };
  }

  async sendToUser(email: string, title: string, body: string, data?: Record<string, any>) {
    return this.sendNotification({ email, title, body, data });
  }
}

export default new NotificationService();
