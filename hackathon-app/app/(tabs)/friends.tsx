import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LeaderboardEntry {
  email: string;
  totalMinutes: number;
  topApp: {
    name: string;
    minutes: number;
  } | null;
  date: string | null;
  isCurrentUser: boolean;
  rank: number;
}

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

export default function FriendsScreen() {
  const [email, setEmail] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail) {
        setEmail(userEmail);
        await fetchLeaderboard(userEmail);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (userEmail: string) => {
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(
        `${API_URL}/api/friends/leaderboard/${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      Alert.alert('Error', 'Failed to load leaderboard');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (email) {
      await fetchLeaderboard(email);
    }
    setRefreshing(false);
  };

  const handleAddFriend = async () => {
    if (!friendEmail.trim()) {
      Alert.alert('Error', 'Please enter a friend\'s email');
      return;
    }

    if (friendEmail.toLowerCase() === email.toLowerCase()) {
      Alert.alert('Error', 'You cannot add yourself as a friend');
      return;
    }

    setAddingFriend(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/friends/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          userEmail: email,
          friendEmail: friendEmail.toLowerCase().trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add friend');
      }

      Alert.alert('Success', `Added ${friendEmail} as a friend!`);
      setFriendEmail('');
      await fetchLeaderboard(email);
    } catch (error: any) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', error.message || 'Failed to add friend');
    } finally {
      setAddingFriend(false);
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

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getRankDisplay = (rank: number): string => {
    const medal = getMedalEmoji(rank);
    if (medal) return medal;
    return `#${rank}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
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
          <Text style={styles.title}>👥 Friends Leaderboard</Text>
          <Text style={styles.subtitle}>Who's procrastinating the most?</Text>
        </View>

        <View style={styles.addFriendCard}>
          <Text style={styles.addFriendTitle}>Add a Friend</Text>
          <TextInput
            style={styles.input}
            placeholder="friend@example.com"
            value={friendEmail}
            onChangeText={setFriendEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.addButton, addingFriend && styles.addButtonDisabled]}
            onPress={handleAddFriend}
            disabled={addingFriend}
          >
            <Text style={styles.addButtonText}>
              {addingFriend ? 'Adding...' : 'Add Friend'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Screen Time Rankings</Text>
          <Text style={styles.sectionSubtitle}>Higher = More procrastination 📱</Text>

          {leaderboard.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>👻</Text>
              <Text style={styles.emptyStateText}>No friends yet!</Text>
              <Text style={styles.emptyStateSubtext}>
                Add friends to see who's procrastinating more
              </Text>
            </View>
          ) : (
            leaderboard.map((entry, index) => (
              <View
                key={`${entry.email}-${index}`}
                style={[
                  styles.leaderboardCard,
                  entry.isCurrentUser && styles.leaderboardCardHighlight,
                  entry.rank <= 3 && styles.leaderboardCardMedal,
                ]}
              >
                <View style={styles.rankContainer}>
                  <Text
                    style={[
                      styles.rankText,
                      entry.rank <= 3 && styles.rankTextMedal,
                    ]}
                  >
                    {getRankDisplay(entry.rank)}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={[styles.userEmail, entry.isCurrentUser && styles.userEmailHighlight]}>
                    {entry.email}
                    {entry.isCurrentUser && ' (You)'}
                  </Text>

                  {entry.topApp && (
                    <View style={styles.appChip}>
                      <Image
                        source={getAppIcon(entry.topApp.name)}
                        style={styles.appChipIcon}
                      />
                      <Text style={styles.appChipText}>
                        {entry.topApp.name} · {formatMinutes(entry.topApp.minutes)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatMinutes(entry.totalMinutes)}</Text>
                  <Text style={styles.timeLabel}>screen time</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 The leaderboard shows total screen time usage. Friends with more usage appear at the top!
          </Text>
        </View>
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
  addFriendCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  addFriendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#c4b5fd',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  leaderboardCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  leaderboardCardHighlight: {
    backgroundColor: '#f0f9ff',
    borderLeftColor: '#3b82f6',
  },
  leaderboardCardMedal: {
    borderLeftWidth: 4,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  rankTextMedal: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  userEmailHighlight: {
    color: '#3b82f6',
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appChipIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
    resizeMode: 'contain',
  },
  appChipText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timeLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
});
