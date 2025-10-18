import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Linking } from 'react-native';
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

export default function DashboardScreen() {
  const { expoPushToken } = useNotifications();
  const [email, setEmail] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
        await fetchAssignments(userEmail);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments(email);
    setRefreshing(false);
  };

  const openChromeWebStore = () => {
    Linking.openURL('https://github.com/rossnoah/hackathon-2025');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>📚 My Assignments</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      {assignments.length === 0 ? (
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
      ) : (
        <View style={styles.assignmentsList}>
          <Text style={styles.assignmentCount}>
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </Text>
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
                <Text style={styles.assignmentDescription} numberOfLines={2}>
                  {assignment.description}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {expoPushToken && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>✓ Push notifications enabled</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
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
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#666',
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
  assignmentsList: {
    marginBottom: 20,
  },
  assignmentCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
