import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, SafeAreaView } from 'react-native';
import { useScreenTime } from '@/hooks/useScreenTime';

const DISTRACTION_APPS = ['TikTok', 'Instagram', 'Twitter', 'Reddit', 'YouTube'];

// Comprehensive app logo mapping with proper brand colors and symbols
const APP_LOGOS: { [key: string]: string } = {
  // Social Media
  'tiktok': '🎬',
  'instagram': '📷',
  'twitter': '𝕏',
  'x.com': '𝕏',
  'reddit': '🔴',
  'youtube': '▶️',
  'youtube tv': '▶️',
  'facebook': '👤',
  'snapchat': '👻',
  'pinterest': '📌',
  'linkedin': '🔗',
  'twitch': '🟣',
  
  // Messaging
  'messages': '💬',
  'sms': '💬',
  'telegram': '✈️',
  'whatsapp': '💚',
  'discord': '⚫',
  'slack': '🟦',
  'skype': '🔵',
  
  // Browsers
  'chrome': '🔵',
  'google chrome': '🔵',
  'chromium': '🔵',
  'firefox': '🦊',
  'safari': '🧭',
  'edge': '🔵',
  'opera': '🔴',
  
  // Music & Entertainment
  'spotify': '🟢',
  'apple music': '🎵',
  'youtube music': '🎵',
  'netflix': '🔴',
  'hulu': '🟢',
  'disney': '🔵',
  'amazon prime': '🟠',
  
  // Productivity
  'notion': '⬜',
  'gmail': '📧',
  'outlook': '📧',
  'mail': '📧',
  'calendar': '📅',
  'drive': '🔵',
  'google drive': '🔵',
  'onedrive': '🔵',
  'dropbox': '🔵',
  'icloud': '☁️',
  
  // Communication
  'zoom': '🔵',
  'teams': '🟦',
  'google meet': '🔵',
  'webex': '🔵',
  
  // News & Reading
  'medium': '⬛',
  'news': '📰',
  'pocket': '🔴',
  'kindle': '⬛',
  
  // Work & Dev
  'github': '⬛',
  'gitlab': '🟠',
  'bitbucket': '🔵',
  'vscode': '🔵',
  'jira': '🔵',
  'trello': '🔵',
  
  // Shopping
  'amazon': '🟠',
  'ebay': '🔴',
  'aliexpress': '🔴',
  'shopify': '🟢',
  
  // Finance
  'paypal': '🔵',
  'stripe': '🔵',
  'square': '🔵',
  'venmo': '🔵',
  'robinhood': '🟢',
  
  // Health & Fitness
  'fitness': '💪',
  'health': '❤️',
  'strava': '🟠',
  'peloton': '⬛',
};

export default function ScreenTimeScreen() {
  const { screenTimeData, isLoading, refreshScreenTimeData } = useScreenTime();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshScreenTimeData();
    setRefreshing(false);
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const isDistractionApp = (appName: string): boolean => {
    return DISTRACTION_APPS.some(app => appName.toLowerCase().includes(app.toLowerCase()));
  };

  const getAppLogo = (appName: string): string => {
    const key = appName.toLowerCase();
    for (const [appKey, logo] of Object.entries(APP_LOGOS)) {
      if (key.includes(appKey)) return logo;
    }
    return '📱';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading screen time data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>📱 Screen Time</Text>
          <Text style={styles.subtitle}>Track your app usage to get smarter AI reminders</Text>
        </View>

        {screenTimeData && (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Total Usage</Text>
              <Text style={styles.summaryTime}>
                {formatMinutes(screenTimeData.totalUsageMinutes)}
              </Text>
              <Text style={styles.summaryApps}>
                {screenTimeData.appUsage.length} apps used today
              </Text>
            </View>

            <View style={styles.appsSection}>
              <Text style={styles.sectionTitle}>App Breakdown</Text>
              {screenTimeData.appUsage.map((app, index) => (
                <View key={`${app.packageName}-${index}`} style={[
                  styles.appCard,
                  isDistractionApp(app.appName) && styles.appCardWarning
                ]}>
                  <View style={styles.appHeader}>
                    <View style={styles.appNameContainer}>
                      <Text style={styles.appLogo}>{getAppLogo(app.appName)}</Text>
                      <View style={styles.appInfo}>
                        <Text style={styles.appName}>{app.appName}</Text>
                        {isDistractionApp(app.appName) && (
                          <Text style={styles.warningTag}>⚠️ Procrastination app</Text>
                        )}
                      </View>
                    </View>
                    <Text style={[
                      styles.appTime,
                      isDistractionApp(app.appName) && styles.appTimeWarning
                    ]}>
                      {formatMinutes(app.usageMinutes)}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        isDistractionApp(app.appName) && styles.progressBarWarning,
                        {
                          width: `${(app.usageMinutes / screenTimeData.totalUsageMinutes) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  {app.lastUsed && (
                    <Text style={styles.appLastUsed}>
                      Last used: {new Date(app.lastUsed).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>


          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#007bff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  summaryApps: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },

  appsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  appCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#e9ecef',
  },
  appCardWarning: {
    backgroundColor: '#fff8e6',
    borderLeftColor: '#ff9800',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
   appNameContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
     marginRight: 12,
   },
   appLogo: {
     fontSize: 32,
     marginRight: 12,
     width: 40,
     textAlign: 'center',
   },
   appInfo: {
     flex: 1,
     justifyContent: 'center',
   },
   appName: {
     fontSize: 16,
     fontWeight: 'bold',
     color: '#333',
   },
   warningTag: {
     fontSize: 11,
     color: '#ff9800',
     fontWeight: '600',
     marginTop: 4,
   },
  appTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  appTimeWarning: {
    color: '#ff9800',
  },
  appPackage: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  appLastUsed: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 3,
  },
   progressBarWarning: {
     backgroundColor: '#ff9800',
   },
 });
