import { Request, Response } from 'express';
import friendsService from '../services/friends.service';
import { logger } from '../utils/logger';

export class FriendsController {
  async addFriend(req: Request, res: Response) {
    const { userEmail, friendEmail } = req.body;

    if (!userEmail || !friendEmail) {
      return res.status(400).json({ error: 'Both userEmail and friendEmail are required' });
    }

    if (userEmail === friendEmail) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    try {
      const result = await friendsService.addFriend(userEmail, friendEmail);
      return res.json(result);
    } catch (error: any) {
      logger.error('Error adding friend:', error);
      return res.status(error.message === 'Friend email not found in system' ? 404 : 500).json({
        error: error.message || 'Failed to add friend',
      });
    }
  }

  async removeFriend(req: Request, res: Response) {
    const { userEmail, friendEmail } = req.body;

    if (!userEmail || !friendEmail) {
      return res.status(400).json({ error: 'Both userEmail and friendEmail are required' });
    }

    try {
      const result = await friendsService.removeFriend(userEmail, friendEmail);
      return res.json(result);
    } catch (error) {
      logger.error('Error removing friend:', error);
      return res.status(500).json({ error: 'Failed to remove friend' });
    }
  }

  async getFriends(req: Request, res: Response) {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const friends = await friendsService.getFriends(email);
      return res.json({
        count: friends.length,
        friends,
      });
    } catch (error) {
      logger.error('Error fetching friends:', error);
      return res.status(500).json({ error: 'Failed to fetch friends' });
    }
  }

  async getLeaderboard(req: Request, res: Response) {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const leaderboard = await friendsService.getLeaderboard(email);
      return res.json({
        count: leaderboard.length,
        leaderboard,
      });
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  }
}

export default new FriendsController();
