import { Image } from 'expo-image';
import { Platform, StyleSheet, Button, View, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { useNotifications, sendTestNotification } from '@/hooks/useNotifications';

export default function HomeScreen() {
  const { expoPushToken, notification } = useNotifications();
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState('');

  // Load saved email on mount
  useEffect(() => {
    AsyncStorage.getItem('userEmail').then((storedEmail) => {
      if (storedEmail) {
        setEmail(storedEmail);
        setSavedEmail(storedEmail);
      }
    });
  }, []);

  const handleSaveEmail = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      await AsyncStorage.setItem('userEmail', email);
      setSavedEmail(email);

      // Register email with server
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          email: email,
          pushToken: expoPushToken,
        }),
      });

      alert('Email registered successfully!');
    } catch (error) {
      console.error('Error saving email:', error);
      alert('Failed to save email');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Your Email</ThemedText>
        <ThemedText style={styles.label}>
          Enter your email to receive assignment reminders:
        </ThemedText>
        <TextInput
          style={styles.input}
          placeholder="your.email@lafayette.edu"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {savedEmail && (
          <ThemedText style={styles.savedEmail}>
            Registered: {savedEmail}
          </ThemedText>
        )}
        <View style={styles.buttonContainer}>
          <Button
            title="Save Email"
            onPress={handleSaveEmail}
          />
        </View>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Push Notifications</ThemedText>
        <ThemedText>
          Your push token: {expoPushToken ? expoPushToken.substring(0, 20) + '...' : 'Getting token...'}
        </ThemedText>
        <View style={styles.buttonContainer}>
          <Button
            title="Send Test Notification"
            onPress={() => sendTestNotification('Hello!', 'This is a test notification from your app')}
          />
        </View>
        {notification && (
          <ThemedView style={styles.notificationContainer}>
            <ThemedText type="defaultSemiBold">Last notification:</ThemedText>
            <ThemedText>{notification.request.content.title}</ThemedText>
            <ThemedText>{notification.request.content.body}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  notificationContainer: {
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  savedEmail: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
