import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Linking, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '@/hooks/useNotifications';

interface Assignment {
  id: string;
  title: string;
  course: string;
  date: string;
  time: string;
  description?: string;
  created_at: string;
}

interface AppUsage {
  appName: string;
  usageMinutes: number;
}

interface Insights {
  hasSocialMediaData: boolean;
  socialMediaPercentage?: number;
  totalScreenTimeMinutes?: number;
  topApps?: AppUsage[];
  message: string;
  assignments: Assignment[];
}

export default function DashboardScreen() {
  const { expoPushToken } = useNotifications();
  const [email, setEmail] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail) {
        setEmail(userEmail);
        await Promise.all([
          fetchAssignments(userEmail),
          fetchInsights(userEmail),
        ]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (userEmail: string) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/assignments?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchInsights = async (userEmail: string) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/insights/${encodeURIComponent(userEmail)}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAssignments(email),
      fetchInsights(email),
    ]);
    setRefreshing(false);
  };

  const openChromeWebStore = () => {
    Linking.openURL('https://github.com/rossnoah/hackathon-2025');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.email}>👋 {email}</Text>
        </View>

        {insights && insights.hasSocialMediaData && (
          <>
            <View style={styles.screenTimeCard}>
              <Text style={styles.screenTimeLabel}>Screen Time Reality Check</Text>
              <Text style={styles.screenTimePercentage}>
                {insights.socialMediaPercentage}%
              </Text>
              <Text style={styles.screenTimeDescription}>
                of your day on social media
              </Text>
              {insights.topApps && insights.topApps.length > 0 && (
                <View style={styles.topAppsContainer}>
                  {insights.topApps.map((app, index) => (
                    <View key={index} style={styles.topApp}>
                      <Text style={styles.topAppName}>{app.appName}</Text>
                      <Text style={styles.topAppTime}>{app.usageMinutes}m</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.messageCard}>
              <Text style={styles.messageIcon}>⚠️</Text>
              <Text style={styles.messageText}>{insights.message}</Text>
            </View>

            {assignments.length > 0 && (
              <View style={styles.assignmentSection}>
                <Text style={styles.sectionTitle}>You should really be doing these:</Text>
                <View style={styles.assignmentsContainer}>
                  {assignments.map((assignment) => (
                    <View key={assignment.id} style={styles.assignmentCard}>
                      <Text style={styles.assignmentTitle}>{assignment.title || 'Untitled'}</Text>
                      <Text style={styles.assignmentCourse}>{assignment.course || 'Unknown course'}</Text>
                      {(assignment.date || assignment.time) && (
                        <View style={styles.assignmentDateRow}>
                          <Text style={styles.assignmentDate}>
                            📅 {assignment.date} {assignment.time}
                          </Text>
                        </View>
                      )}
                      {assignment.description && (
                        <Text style={styles.assignmentDescription}>
                          {assignment.description}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {(!insights || !insights.hasSocialMediaData) && (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataEmoji}>📱</Text>
            <Text style={styles.noDataTitle}>No screen time data yet</Text>
            <Text style={styles.noDataText}>
              Go to the Screen Time tab to share your app usage and get AI-generated insights about your procrastination habits!
            </Text>
          </View>
        )}

        {assignments.length === 0 && insights && insights.hasSocialMediaData && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No assignments yet</Text>
            <Text style={styles.emptyText}>
              To get started, install the Chrome extension and sync your Moodle assignments.
            </Text>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>How to sync:</Text>
              <Text style={styles.instructionStep}>1. Install the Chrome extension</Text>
              <Text style={styles.instructionStep}>2. Enter your email: {email}</Text>
              <Text style={styles.instructionStep}>3. Click "Sync Assignments"</Text>
              <Text style={styles.instructionStep}>4. Pull to refresh this screen</Text>
            </View>
            <Text style={styles.linkText} onPress={openChromeWebStore}>
              Get the Chrome Extension →
            </Text>
          </View>
        )}

        {expoPushToken && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>✓ Push notifications enabled</Text>
          </View>
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
  email: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },

  screenTimeCard: {
    backgroundColor: '#ff6b6b',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  screenTimeLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
    marginBottom: 8,
  },
  screenTimePercentage: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  screenTimeDescription: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.95,
    marginBottom: 12,
  },
  topAppsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  topApp: {
    flex: 1,
    alignItems: 'center',
  },
  topAppName: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  topAppTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  messageCard: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  messageIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: -2,
  },
  messageText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },

  noDataCard: {
    backgroundColor: '#e7f3ff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
  },
  noDataEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#0056b3',
    textAlign: 'center',
    lineHeight: 20,
  },

  assignmentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  assignmentsContainer: {
    marginBottom: 8,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
    lineHeight: 24,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },

  assignmentCard: {
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
    borderLeftColor: '#007bff',
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  assignmentCourse: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  assignmentDateRow: {
    marginBottom: 8,
  },
  assignmentDate: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
});
