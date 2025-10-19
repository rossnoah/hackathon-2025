import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import { logger } from '../utils/logger';

export class NotificationController {
  async sendNotification(req: Request, res: Response) {
    const { title, body, data, email } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    try {
      const result = await notificationService.sendNotification({
        title,
        body,
        data,
        email,
      });

      return res.json(result);
    } catch (error: any) {
      logger.error('Error sending notifications:', error);
      return res.status(500).json({ error: error.message || 'Failed to send notifications' });
    }
  }
}

export default new NotificationController();
