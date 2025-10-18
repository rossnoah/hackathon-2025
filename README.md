# Hackathon 2025 - Push Notification System

A full-stack push notification system built with Express.js server and Expo React Native app.

## Project Structure

```
hackathon/
├── server.js              # Express server with Expo push notifications
├── package.json           # Server dependencies
├── README.md              # This file
├── hackathon-app/         # Expo React Native app
│   ├── app/              # App routes (Expo Router)
│   │   └── (tabs)/
│   │       └── index.tsx # Home screen with notifications demo
│   ├── hooks/
│   │   └── useNotifications.ts  # Push notification hook
│   ├── .env              # Environment variables (not committed)
│   ├── .env.example      # Environment template
│   └── package.json      # App dependencies
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- [ngrok](https://ngrok.com/) account (free tier works)
- Physical iOS or Android device (notifications don't work in simulators)
- Expo Go app or EAS development build

## Quick Start

### 1. Install Server Dependencies

```bash
npm install
```

### 2. Start the Express Server

```bash
npm run dev
```

The server will run on `http://localhost:4000`

### 3. Setup ngrok (Required for Mobile App)

ngrok creates a secure tunnel to your local server, allowing your mobile app to communicate with localhost over the internet.

#### Install ngrok

```bash
# macOS (using Homebrew)
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Authenticate ngrok

1. Sign up at [ngrok.com](https://ngrok.com) (free account works)
2. Get your auth token from the dashboard
3. Configure:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### Start ngrok tunnel

In a **new terminal window**:

```bash
ngrok http 4000
```

You'll see output like:

```
Forwarding  https://apparent-stinkbug-moral.ngrok-free.app -> http://localhost:4000
```

**Copy the HTTPS URL** - you'll need it for the next step!

### 4. Configure the App

```bash
cd hackathon-app
npm install
cp .env.example .env
```

Edit `.env` and add your ngrok URL:

```
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
```

### 5. Start the App

```bash
npx expo start
```

- Scan QR code with Expo Go app on your **physical device**
- Or press `i` for iOS simulator / `a` for Android emulator (limited notification support)

**Important:** Push notifications only work on physical devices!

## API Endpoints

### POST /api/register-token
Register a push token with the server.

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token registered successfully"
}
```

### POST /api/send-notification
Send a push notification to all registered devices.

**Request Body:**
```json
{
  "title": "Notification Title",
  "body": "Notification message body",
  "data": {
    "customKey": "customValue"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "tickets": [...]
}
```

### GET /api/tokens
Get all registered push tokens.

**Response:**
```json
{
  "count": 1,
  "tokens": ["ExponentPushToken[...]"]
}
```

### DELETE /api/tokens
Clear all registered tokens.

**Response:**
```json
{
  "success": true,
  "message": "All tokens cleared"
}
```

## How It Works

1. **App Launch:** When the app starts, it requests notification permissions and generates an Expo Push Token
2. **Token Registration:** The token is automatically registered with the Express server via POST /api/register-token
3. **Sending Notifications:** Use the in-app UI or API endpoint to send notifications
4. **Receiving Notifications:** The app displays notifications when received, both in foreground and background

## Testing Notifications

### Using the App UI

1. Open the app and navigate to the home screen
2. You'll see your push token displayed
3. Enter a title and body for the notification
4. Press "Send Notification" button
5. The notification will be sent via the server and delivered to your device

### Using cURL

```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/api/send-notification \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message!",
    "data": {"timestamp": 1234567890}
  }'
```

## ngrok Details

### Why ngrok?

When developing locally, your server runs on `localhost:4000`, which is only accessible from your computer. Mobile devices can't reach `localhost` - they need a real URL. ngrok solves this by:

1. Creating a public HTTPS URL
2. Tunneling all traffic to your local server
3. Providing a web interface to inspect requests at `http://localhost:4040`

### Important ngrok Notes

- **Free tier URLs change** every time you restart ngrok - update your `.env` when this happens
- The tunnel **expires** when you close ngrok
- For production, use a static domain (paid) or deploy to a cloud server
- ngrok includes browser warnings by default - the app adds `ngrok-skip-browser-warning` header to bypass this

### Development Workflow

Keep these running in separate terminals:

1. **Terminal 1:** `npm run dev` (server)
2. **Terminal 2:** `ngrok http 4000` (tunnel)
3. **Terminal 3:** `cd hackathon-app && npx expo start` (app)

If ngrok restarts and the URL changes:
1. Copy the new URL
2. Update `hackathon-app/.env`
3. Restart the Expo app

## Troubleshooting

### Notifications not appearing
- Make sure you've granted notification permissions
- On iOS, close the app completely to see notification banners
- Check that the server is running and accessible from your device
- Verify the push token is registered (check server logs or /api/tokens endpoint)

### Cannot connect to server / JSON Parse errors
- **Check server is running** on port 4000
- **Verify ngrok is running** - run `curl https://your-ngrok-url.ngrok-free.app/` to test
- Update `.env` with correct ngrok URL
- Restart the Expo app after changing `.env`
- Check that `ngrok-skip-browser-warning` header is included

### Invalid push token
- Ensure you're running on a **physical device** (simulators don't support push tokens)
- Check that `expo-notifications` is properly configured in `app.json`
- Verify EAS project ID is correct in `app.json`

## Production Deployment

For production deployment:

1. **Deploy server** to a cloud provider (Heroku, AWS, Railway, etc.)
2. **Use a database** (PostgreSQL, MongoDB) instead of in-memory token storage
3. **Update `.env`** with production server URL
4. **Build app:** `eas build --platform all`
5. **Submit to stores:** `eas submit`

## Tech Stack

- **Server:** Express.js, expo-server-sdk, CORS
- **App:** React Native, Expo, expo-router, expo-notifications, TypeScript
- **Dev Tools:** ngrok, nodemon
