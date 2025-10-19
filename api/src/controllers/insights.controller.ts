import { Request, Response } from 'express';
import aiService from '../services/ai.service';
import { logger } from '../utils/logger';

export class InsightsController {
  async getInsights(req: Request, res: Response) {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    try {
      const insights = await aiService.getInsights(email);
      return res.json(insights);
    } catch (error) {
      logger.error('Error fetching insights:', error);
      return res.status(500).json({ error: 'Failed to fetch insights' });
    }
  }
}

export default new InsightsController();
