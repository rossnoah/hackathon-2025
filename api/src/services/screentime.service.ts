import prisma from '../config/database';
import { ScreentimeInput } from '../types';
import userService from './user.service';

export class ScreentimeService {
  async storeScreentime(input: ScreentimeInput) {
    const { email, appUsage, date } = input;

    // Ensure user exists
    await userService.ensureUserExists(email);

    const totalUsageMinutes = appUsage.reduce(
      (sum, app) => sum + (app.usageMinutes || 0),
      0
    );

    const screentimeDate = date || new Date().toISOString().split('T')[0];

    await prisma.screentime.create({
      data: {
        email,
        appUsage: JSON.stringify(appUsage),
        totalUsageMinutes,
        date: screentimeDate,
      },
    });

    return {
      success: true,
      totalUsageMinutes,
      totalApps: appUsage.length,
    };
  }

  async getLatestScreentime(email: string) {
    return prisma.screentime.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new ScreentimeService();
