import { Request, Response } from 'express';
import screentimeService from '../services/screentime.service';
import { logger } from '../utils/logger';

export class ScreentimeController {
  async storeScreentime(req: Request, res: Response) {
    const { email, appUsage, date } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!appUsage || !Array.isArray(appUsage)) {
      return res.status(400).json({ error: 'appUsage array is required' });
    }

    try {
      const result = await screentimeService.storeScreentime({
        email,
        appUsage,
        date,
      });

      const screentimeData = {
        email,
        date: date || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        appUsage,
        totalApps: result.totalApps,
        totalUsageMinutes: result.totalUsageMinutes,
      };

      logger.info('📱 SCREEN TIME DATA STORED:', JSON.stringify(screentimeData, null, 2));

      return res.json({
        success: true,
        message: 'Screen time data received and stored',
        received: screentimeData,
      });
    } catch (error) {
      logger.error('Error processing screen time data:', error);
      return res.status(500).json({ error: 'Failed to process screen time data' });
    }
  }
}

export default new ScreentimeController();
