# Push Notifications Setup

This app is configured to receive push notifications from the server running at `https://apparent-stinkbug-moral.ngrok-free.app`.

## How It Works

### Server Side (port 4000)
The server at `/Users/noah/Code/hackathon/server.js` provides these endpoints:

- `POST /api/register-token` - Register a device's Expo push token
- `POST /api/send-notification` - Send notifications to all registered devices
- `GET /api/tokens` - View all registered tokens
- `DELETE /api/tokens` - Clear all registered tokens

### App Side
The app automatically:
1. Requests notification permissions on launch
2. Gets an Expo push token
3. Registers the token with your server
4. Listens for incoming notifications

## Usage

### In the App
1. Open the app on a physical device (notifications don't work on simulators)
2. Grant notification permissions when prompted
3. Your push token will be automatically registered with the server
4. Tap "Send Test Notification" button to send a test notification to all registered devices

### From the Server
You can send notifications by making a POST request to your server:

```bash
curl -X POST https://apparent-stinkbug-moral.ngrok-free.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello from server!",
    "body": "This is a notification sent from the server",
    "data": {"customField": "value"}
  }'
```

### From Code
Use the `sendTestNotification` helper function:

```typescript
import { sendTestNotification } from '@/hooks/useNotifications';

sendTestNotification('Title', 'Message body', { custom: 'data' });
```

## Files Modified

- `hackathon-app/hooks/useNotifications.ts` - Custom hook for handling notifications
- `hackathon-app/app/(tabs)/index.tsx` - Home screen with notification demo
- `hackathon-app/app.json` - Added expo-notifications plugin

## Important Notes

- Notifications only work on physical devices, not simulators/emulators
- The app must be built with EAS (`eas build`) to use notifications in production
- For development, use Expo Go app or a development build
- The server stores tokens in memory - they will be lost when the server restarts
- For production, store tokens in a database

## Testing

1. Start the server: `cd /Users/noah/Code/hackathon && npm run dev`
2. Start the app: `cd hackathon-app && npx expo start`
3. Open the app on a physical device
4. Use the "Send Test Notification" button or send from the server
