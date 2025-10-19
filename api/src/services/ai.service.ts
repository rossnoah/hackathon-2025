import openai from '../config/openai';
import { Assignment } from '@prisma/client';
import { AppUsage } from '../types';
import screentimeService from './screentime.service';
import assignmentService from './assignment.service';
import { logger } from '../utils/logger';

export class AIService {
  async generateDuolingoNotification(
    assignments: Assignment[],
    email: string
  ): Promise<string> {
    try {
      const assignmentContext = assignments
        .map((a) => `- ${a.title} (${a.course}) due ${a.date} ${a.time}`)
        .join('\n');

      // Get latest screentime data for this user
      let screentimeContext = '';
      try {
        const latestScreentime = await screentimeService.getLatestScreentime(email);

        if (latestScreentime) {
          const appUsage: AppUsage[] = JSON.parse(latestScreentime.appUsage);
          const topApps = appUsage
            .slice(0, 3)
            .map((app) => `${app.appName} (${app.usageMinutes}m)`)
            .join(', ');
          screentimeContext = `\n\nThe student's top apps today: ${topApps}. Consider mentioning these in a cheeky way to guilt them about procrastinating!`;
        }
      } catch (err) {
        logger.error('Error fetching screentime context:', err);
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a witty, highly aggressive notification bot similar to Duolingo's owl. Your job is to remind students about their assignments in a fun, motivating, but slightly guilt-inducing way. Keep it short (max 2 sentences), funny, and personalized. Be creative and vary your approach - sometimes encouraging, very playfully threatening, sometimes disappointed. Make it feel personal and urgent but lighthearted. If you know what apps they've been using, call them out on it (e.g., "stop wasting time on TikTok, you have an assignment due!"). The messages should be vaguely threatening and short. Do not call them by their name or by [Student Name] or anything similar to that.`,
          },
          {
            role: 'user',
            content: `Generate a short notification message for a student with these upcoming assignments:\n${assignmentContext}${screentimeContext}`,
          },
        ],
        temperature: 1.0,
        max_tokens: 100,
      });

      return completion.choices[0].message.content?.trim() || this.getFallbackMessage();
    } catch (error) {
      logger.error('Error generating notification:', error);
      return this.getFallbackMessage();
    }
  }

  async generateInsightsMessage(
    assignments: Assignment[],
    appUsage: AppUsage[],
    socialMediaPercentage: number
  ): Promise<string> {
    try {
      const appsList = appUsage
        .map((app) => `${app.appName} (${app.usageMinutes}m)`)
        .join(', ');

      const assignmentsList = assignments
        .map((a) => `- ${a.title} (${a.course}) due ${a.date}`)
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a witty and slightly aggressive academic coach. Your job is to give students a reality check about their procrastination. Be direct, slightly guilt-inducing, but funny and motivating. Keep it to 1-2 sentences max. The tone should be like a concerned friend who's a bit sarcastic.`,
          },
          {
            role: 'user',
            content: `This student has spent ${socialMediaPercentage}% of their day on social media apps: ${appsList}. They have these assignments due soon:\n${assignmentsList || 'No specific assignments yet'}\n\nGive them a reality check about how their day is going.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 80,
      });

      return completion.choices[0].message.content?.trim() || this.getFallbackInsightsMessage(socialMediaPercentage);
    } catch (error) {
      logger.error('Error generating AI message:', error);
      return this.getFallbackInsightsMessage(socialMediaPercentage);
    }
  }

  async getInsights(email: string) {
    // Get latest screentime data
    const latestScreentime = await screentimeService.getLatestScreentime(email);

    // Get user's assignments
    const assignments = await assignmentService.getAssignmentsByEmail(email);

    if (!latestScreentime) {
      return {
        hasSocialMediaData: false,
        message: 'Start tracking your screen time to get personalized insights!',
        assignments: assignments || [],
      };
    }

    const appUsage: AppUsage[] = JSON.parse(latestScreentime.appUsage);
    const totalMinutesInDay = 24 * 60;
    const socialMediaPercentage = Math.round(
      (latestScreentime.totalUsageMinutes / totalMinutesInDay) * 100
    );

    // Generate AI message about procrastination
    const aiMessage = await this.generateInsightsMessage(
      assignments,
      appUsage,
      socialMediaPercentage
    );

    return {
      hasSocialMediaData: true,
      socialMediaPercentage,
      totalScreenTimeMinutes: latestScreentime.totalUsageMinutes,
      topApps: appUsage.slice(0, 3),
      message: aiMessage,
      assignments: assignments || [],
    };
  }

  private getFallbackMessage(): string {
    const fallbacks = [
      "Your assignments are piling up... just saying 👀",
      "I'm not mad, just disappointed you haven't checked your assignments yet 📚",
      "Those assignments aren't going to complete themselves... unfortunately 🎓",
      "Me: Hey, check your assignments!\nYou: *ignores*\nMe: 😢",
      "Stop scrolling and get back to work! 📱➡️📚",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  private getFallbackInsightsMessage(socialMediaPercentage: number): string {
    const fallbacks = [
      `You've spent ${socialMediaPercentage}% of your day on social media... maybe it's time to focus on those assignments? 📚`,
      `Social media: ${socialMediaPercentage}% of your day. Assignments: Still waiting for you. The math checks out. 📱➡️📚`,
      `${socialMediaPercentage}% on TikTok/Instagram? Buddy, those assignments aren't going to do themselves! ⏰`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export default new AIService();
