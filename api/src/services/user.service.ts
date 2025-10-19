import prisma from '../config/database';
import { RegisterUserInput } from '../types';

export class UserService {
  async ensureUserExists(email: string, pushToken?: string | null): Promise<boolean> {
    try {
      await prisma.user.upsert({
        where: { email },
        update: {
          pushToken: pushToken ?? undefined,
          lastSeen: new Date(),
        },
        create: {
          email,
          pushToken: pushToken ?? undefined,
          lastSeen: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      return false;
    }
  }

  async registerUser(input: RegisterUserInput) {
    const { email, pushToken, notificationsEnabled } = input;

    await this.ensureUserExists(email, pushToken);

    if (notificationsEnabled !== undefined) {
      await prisma.user.update({
        where: { email },
        data: { notificationsEnabled },
      });
    }

    return { email, success: true };
  }

  async toggleNotifications(email: string, enabled: boolean) {
    await prisma.user.update({
      where: { email },
      data: { notificationsEnabled: enabled },
    });

    return { email, enabled, success: true };
  }

  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        email: true,
        pushToken: true,
        createdAt: true,
        lastSeen: true,
      },
    });
  }

  async getUsersWithPushTokens(notificationsEnabled: boolean = true) {
    return prisma.user.findMany({
      where: {
        pushToken: { not: null },
        notificationsEnabled,
      },
      select: {
        email: true,
        pushToken: true,
      },
    });
  }
}

export default new UserService();
