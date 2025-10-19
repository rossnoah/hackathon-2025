import prisma from '../config/database';

export class FriendsService {
  async addFriend(userEmail: string, friendEmail: string) {
    // Check if friend exists
    const friendExists = await prisma.user.findUnique({
      where: { email: friendEmail },
    });

    if (!friendExists) {
      throw new Error('Friend email not found in system');
    }

    // Add bidirectional friendship
    await prisma.$transaction([
      prisma.friend.upsert({
        where: {
          userEmail_friendEmail: {
            userEmail,
            friendEmail,
          },
        },
        create: {
          userEmail,
          friendEmail,
        },
        update: {},
      }),
      prisma.friend.upsert({
        where: {
          userEmail_friendEmail: {
            userEmail: friendEmail,
            friendEmail: userEmail,
          },
        },
        create: {
          userEmail: friendEmail,
          friendEmail: userEmail,
        },
        update: {},
      }),
    ]);

    return { success: true, message: `Added ${friendEmail} as a friend` };
  }

  async removeFriend(userEmail: string, friendEmail: string) {
    await prisma.$transaction([
      prisma.friend.deleteMany({
        where: {
          OR: [
            { userEmail, friendEmail },
            { userEmail: friendEmail, friendEmail: userEmail },
          ],
        },
      }),
    ]);

    return { success: true, message: `Removed ${friendEmail} from friends` };
  }

  async getFriends(userEmail: string) {
    const friends = await prisma.friend.findMany({
      where: { userEmail },
      include: {
        friend: {
          select: {
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friends.map(f => ({
      email: f.friend.email,
      createdAt: f.friend.createdAt,
    }));
  }

  async getLeaderboard(userEmail: string) {
    // Get all users with screentime data
    const allUsersWithScreentime = await prisma.screentime.findMany({
      select: { email: true },
      distinct: ['email'],
    });

    const allEmails = allUsersWithScreentime.map(s => s.email);

    // Get latest screentime data for each person
    const leaderboard = await Promise.all(
      allEmails.map(async (email) => {
        const latestScreentime = await prisma.screentime.findFirst({
          where: { email },
          orderBy: { createdAt: 'desc' },
        });

        if (latestScreentime) {
          const appUsage = JSON.parse(latestScreentime.appUsage);
          const topApp = appUsage.length > 0 ? appUsage[0] : null;

          return {
            email,
            totalMinutes: latestScreentime.totalUsageMinutes,
            topApp: topApp
              ? {
                  name: topApp.appName,
                  minutes: topApp.usageMinutes,
                }
              : null,
            date: latestScreentime.date,
            isCurrentUser: email === userEmail,
          };
        }

        return {
          email,
          totalMinutes: 0,
          topApp: null,
          date: null,
          isCurrentUser: email === userEmail,
        };
      })
    );

    // Sort by total minutes descending (most usage at top)
    leaderboard.sort((a, b) => b.totalMinutes - a.totalMinutes);

    // Add ranking
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return rankedLeaderboard;
  }
}

export default new FriendsService();
