import { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, SafeAreaView, Image } from 'react-native';
import { useScreenTime } from '@/hooks/useScreenTime';

const DISTRACTION_APPS = ['TikTok', 'Instagram', 'Twitter', 'Reddit', 'YouTube'];

// Emojis for common apps
function getAppIcon(name: string) {
  const key = name.toLowerCase();
  try {
    if (key.includes('tiktok')) return require('../../assets/images/app-logos/tiktok.png');
    if (key.includes('instagram')) return require('../../assets/images/app-logos/instagram.png');
    if (key.includes('twitter') || key.includes('x')) return require('../../assets/images/app-logos/twitter.png');
    if (key.includes('reddit')) return require('../../assets/images/app-logos/reddit.png');
    if (key.includes('youtube')) return require('../../assets/images/app-logos/youtube.png');
    if (key.includes('spotify')) return require('../../assets/images/app-logos/spotify.png');
    if (key.includes('chrome')) return require('../../assets/images/app-logos/chrome.png');
    if (key.includes('message') || key.includes('imessage') || key.includes('sms')) return require('../../assets/images/app-logos/imessage.png');
  } catch (e) {}
  return require('../../assets/images/icon.png');
}

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

  const getAppLogo = (appName: string) => {
    return getAppIcon(appName);
  };

  const distractionMinutes = useMemo(() => {
    if (!screenTimeData) return 0;
    return screenTimeData.appUsage
      .filter(a => isDistractionApp(a.appName))
      .reduce((sum, a) => sum + a.usageMinutes, 0);
  }, [screenTimeData]);

  const distractionPct = useMemo(() => {
    if (!screenTimeData || screenTimeData.totalUsageMinutes === 0) return 0;
    return Math.round((distractionMinutes / screenTimeData.totalUsageMinutes) * 100);
  }, [screenTimeData, distractionMinutes]);

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
              <View style={styles.summaryHeaderRow}>
                <Text style={styles.summaryTitle}>Today</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryMetricLabel}>Total usage</Text>
                  <Text style={styles.summaryTime}>
                    {formatMinutes(screenTimeData.totalUsageMinutes)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryMetricLabel}>Distractions</Text>
                  <Text style={[styles.summaryTime, { color: distractionPct > 40 ? '#ff6b6b' : distractionPct > 20 ? '#ff9800' : '#fff' }]}>
                    {distractionPct}%
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(distractionPct, 100)}%`, backgroundColor: distractionPct > 40 ? '#ff6b6b' : distractionPct > 20 ? '#ff9800' : '#10b981' }]} />
                </View>
                <Text style={styles.progressHint}>{distractionMinutes} min on distraction apps</Text>
              </View>

              <View style={styles.topChipsRow}>
                {screenTimeData.appUsage.slice(0, 3).map((app, idx) => (
                  <View key={`${app.packageName}-${idx}`} style={styles.chip}>
                    <Image source={getAppLogo(app.appName)} style={styles.chipIcon} />
                    <Text style={styles.chipText}>{app.appName} · {formatMinutes(app.usageMinutes)}</Text>
                  </View>
                ))}
              </View>
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
                      <Image source={getAppLogo(app.appName)} style={styles.appIcon} />
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
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarContainerItem}>
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
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  summaryMetricLabel: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  summaryTime: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 12,
  },
  progressBarContainer: {
    marginTop: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressHint: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
  },
  topChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  chipIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
    resizeMode: 'contain',
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
  appIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    borderRadius: 6,
    resizeMode: 'contain',
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
  appLastUsed: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainerItem: {
    flex: 1,
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
