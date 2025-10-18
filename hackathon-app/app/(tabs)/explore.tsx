import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScreenTime } from '@/hooks/useScreenTime';

const DISTRACTION_APPS = ['TikTok', 'Instagram', 'Twitter', 'Reddit', 'YouTube'];

export default function ScreenTimeScreen() {
  const [email, setEmail] = useState<string>('');
  const { screenTimeData, isLoading, refreshScreenTimeData, sendScreenTimeToServer } = useScreenTime();
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail) {
        setEmail(userEmail);
      }
    } catch (error) {
      console.error('Error loading user email:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshScreenTimeData();
    setRefreshing(false);
  };

  const handleSendToServer = async () => {
    if (!email) {
      Alert.alert('Error', 'No email found. Please complete onboarding.');
      return;
    }

    setSending(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const result = await sendScreenTimeToServer(email, API_URL);
      Alert.alert('✨ Data Sent', 'Your screen time data has been shared with the AI notification system. Expect smarter, more roasting reminders!');
      console.log('Server response:', result);
    } catch (error) {
      Alert.alert('Error', 'Failed to send screen time data to server');
      console.error('Error sending screen time:', error);
    } finally {
      setSending(false);
    }
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

  const getAppEmoji = (appName: string): string => {
    const emojiMap: { [key: string]: string } = {
      'tiktok': '🎬',
      'instagram': '📸',
      'twitter': '𝕏',
      'reddit': '🤖',
      'youtube': '🎥',
      'chrome': '🌐',
      'spotify': '🎵',
      'messages': '💬',
    };
    const key = appName.toLowerCase();
    for (const [appKey, emoji] of Object.entries(emojiMap)) {
      if (key.includes(appKey)) return emoji;
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

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                Share your screen time data with the server to receive personalized reminders about your procrastination habits!
              </Text>
            </View>

            <View style={styles.sendButtonContainer}>
              <TouchableOpacity
                style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                onPress={handleSendToServer}
                disabled={sending}
              >
                <Text style={styles.sendButtonText}>
                  {sending ? 'Sending...' : '📤 Send Screen Time to AI'}
                </Text>
              </TouchableOpacity>
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
                      <Text style={styles.appEmoji}>{getAppEmoji(app.appName)}</Text>
                      <View>
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

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                💬 This mock data will help train the AI to give you more personalized and hilarious reminders about your assignments!
              </Text>
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
  infoCard: {
    backgroundColor: '#e7f3ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#0056b3',
    flex: 1,
    lineHeight: 18,
  },
  sendButtonContainer: {
    marginBottom: 24,
  },
  sendButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  appEmoji: {
    fontSize: 24,
    marginRight: 12,
    marginTop: -2,
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
  disclaimer: {
    backgroundColor: '#f0f4ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#4338ca',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
