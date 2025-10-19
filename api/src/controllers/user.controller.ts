import { Request, Response } from 'express';
import userService from '../services/user.service';
import { Expo } from 'expo-server-sdk';
import { logger } from '../utils/logger';

export class UserController {
  async register(req: Request, res: Response) {
    const { email, pushToken, notificationsEnabled } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate push token if provided
    if (pushToken && !Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({ error: 'Invalid Expo push token' });
    }

    try {
      await userService.registerUser({ email, pushToken, notificationsEnabled });

      return res.json({
        success: true,
        message: 'User registered successfully',
        email,
      });
    } catch (error) {
      logger.error('Error registering user:', error);
      return res.status(500).json({ error: 'Failed to register user' });
    }
  }

  async toggleNotifications(req: Request, res: Response) {
    const { email, enabled } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Enabled must be a boolean' });
    }

    try {
      const result = await userService.toggleNotifications(email, enabled);

      return res.json({
        success: true,
        message: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
        email: result.email,
        enabled: result.enabled,
      });
    } catch (error) {
      logger.error('Error toggling notifications:', error);
      return res.status(500).json({ error: 'Failed to toggle notifications' });
    }
  }

  async getAllUsers(_req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      return res.json({ count: users.length, users });
    } catch (error) {
      logger.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
}

export default new UserController();
