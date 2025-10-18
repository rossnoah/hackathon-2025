import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export interface AppUsage {
  appName: string;
  packageName: string;
  usageMinutes: number;
  lastUsed?: string;
}

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export function useNotifications() {
   const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
   const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
   const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
   const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

   useEffect(() => {
     // Register for push notifications and send screentime data
     registerForPushNotificationsAsync().then(token => {
       setExpoPushToken(token);
       if (token) {
         registerTokenWithServer(token);
       }
     });

     // Auto-send screentime data when app opens
     sendScreentimeDataOnAppOpen();

     // Listen for notifications received while app is open
     notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
       setNotification(notification);
     });

     // Listen for user interactions with notifications
     responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
       console.log('Notification response:', response);
     });

     return () => {
       if (notificationListener.current) {
         notificationListener.current.remove();
       }
       if (responseListener.current) {
         responseListener.current.remove();
       }
     };
   }, []);

   return {
     expoPushToken,
     notification,
   };
 }

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        throw new Error('Project ID not found');
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.error('Error getting push token:', e);
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

async function registerTokenWithServer(token: string): Promise<void> {
  try {
    // Get the user's email from storage
    const email = await AsyncStorage.getItem('userEmail');

    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        email: email || undefined,
        pushToken: token
      }),
    });

    const data = await response.json();
    console.log('Token registered with server:', data);
  } catch (error) {
    console.error('Error registering token with server:', error);
  }
}

// Helper function to send a test notification from the app
export async function sendTestNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
   try {
     const response = await fetch(`${API_URL}/api/send-notification`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'ngrok-skip-browser-warning': 'true',
       },
       body: JSON.stringify({ title, body, data }),
     });

     const result = await response.json();
     console.log('Notification sent:', result);
   } catch (error) {
     console.error('Error sending notification:', error);
   }
 }

// Auto-send screentime data when app opens
async function sendScreentimeDataOnAppOpen(): Promise<void> {
   try {
     const email = await AsyncStorage.getItem('userEmail');
     if (!email) return;

     const today = new Date().toISOString().split('T')[0];
     const storedDataKey = `screentime_${today}`;
     const storedData = await AsyncStorage.getItem(storedDataKey);

     if (!storedData) return;

     const screenTimeData = JSON.parse(storedData);

     const response = await fetch(`${API_URL}/api/screentime`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'ngrok-skip-browser-warning': 'true',
       },
       body: JSON.stringify({
         email,
         appUsage: screenTimeData.appUsage,
         date: screenTimeData.date,
       }),
     });

     if (response.ok) {
       console.log('Screentime data sent to server on app open');
     }
   } catch (error) {
     console.error('Error sending screentime data on app open:', error);
   }
 }
