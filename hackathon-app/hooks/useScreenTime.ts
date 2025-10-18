import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppUsage {
  appName: string;
  packageName: string;
  usageMinutes: number;
  lastUsed?: string;
}

interface ScreenTimeData {
  date: string;
  appUsage: AppUsage[];
  totalUsageMinutes: number;
}

/**
 * Hook to track and manage screen time data
 *
 * NOTE: This is a MOCK implementation for demonstration purposes.
 * Real implementation requires:
 * - iOS: Screen Time API (requires special entitlements)
 * - Android: UsageStatsManager (requires PACKAGE_USAGE_STATS permission)
 * - Custom native module with expo-dev-client
 *
 * For production, consider:
 * - react-native-usage-stats (Android)
 * - Custom native module for iOS
 * - Background tracking service
 */
export function useScreenTime() {
  const [screenTimeData, setScreenTimeData] = useState<ScreenTimeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate mock screen time data for demonstration
  const generateMockScreenTimeData = (): ScreenTimeData => {
    const today = new Date().toISOString().split('T')[0];

    // Mock app usage data
    const mockApps: AppUsage[] = [
      {
        appName: 'Instagram',
        packageName: 'com.instagram.android',
        usageMinutes: Math.floor(Math.random() * 120) + 30, // 30-150 mins
        lastUsed: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      },
      {
        appName: 'TikTok',
        packageName: 'com.zhiliaoapp.musically',
        usageMinutes: Math.floor(Math.random() * 180) + 20,
        lastUsed: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      },
      {
        appName: 'YouTube',
        packageName: 'com.google.android.youtube',
        usageMinutes: Math.floor(Math.random() * 100) + 40,
        lastUsed: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      },
      {
        appName: 'Chrome',
        packageName: 'com.android.chrome',
        usageMinutes: Math.floor(Math.random() * 90) + 15,
        lastUsed: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      },
      {
        appName: 'Messages',
        packageName: 'com.google.android.apps.messaging',
        usageMinutes: Math.floor(Math.random() * 60) + 10,
        lastUsed: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      },
      {
        appName: 'Spotify',
        packageName: 'com.spotify.music',
        usageMinutes: Math.floor(Math.random() * 150) + 20,
        lastUsed: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      },
      {
        appName: 'Reddit',
        packageName: 'com.reddit.frontpage',
        usageMinutes: Math.floor(Math.random() * 80) + 15,
        lastUsed: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      },
      {
        appName: 'Twitter',
        packageName: 'com.twitter.android',
        usageMinutes: Math.floor(Math.random() * 70) + 10,
        lastUsed: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      },
    ];

    // Sort by usage time (descending)
    mockApps.sort((a, b) => b.usageMinutes - a.usageMinutes);

    const totalUsageMinutes = mockApps.reduce((sum, app) => sum + app.usageMinutes, 0);

    return {
      date: today,
      appUsage: mockApps,
      totalUsageMinutes,
    };
  };

  // Load screen time data (from storage or generate new)
  const loadScreenTimeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      const storedDataKey = `screentime_${today}`;

      // Try to load from storage
      const storedData = await AsyncStorage.getItem(storedDataKey);

      if (storedData) {
        setScreenTimeData(JSON.parse(storedData));
      } else {
        // Generate new mock data
        const newData = generateMockScreenTimeData();
        await AsyncStorage.setItem(storedDataKey, JSON.stringify(newData));
        setScreenTimeData(newData);
      }
    } catch (err) {
      console.error('Error loading screen time data:', err);
      setError('Failed to load screen time data');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh screen time data (simulate fetching latest usage)
  const refreshScreenTimeData = async () => {
    const newData = generateMockScreenTimeData();
    const today = new Date().toISOString().split('T')[0];
    const storedDataKey = `screentime_${today}`;

    try {
      await AsyncStorage.setItem(storedDataKey, JSON.stringify(newData));
      setScreenTimeData(newData);
    } catch (err) {
      console.error('Error refreshing screen time data:', err);
      setError('Failed to refresh screen time data');
    }
  };

  // Send screen time data to server
  const sendScreenTimeToServer = async (email: string, apiUrl: string) => {
    if (!screenTimeData) {
      throw new Error('No screen time data available');
    }

    try {
      const response = await fetch(`${apiUrl}/api/screentime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          appUsage: screenTimeData.appUsage,
          date: screenTimeData.date,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error sending screen time to server:', err);
      throw err;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadScreenTimeData();
  }, []);

  return {
    screenTimeData,
    isLoading,
    error,
    refreshScreenTimeData,
    sendScreenTimeToServer,
  };
}
