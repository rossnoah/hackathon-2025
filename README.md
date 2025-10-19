# Hackathon 2025 - Blinky Assignment Tracker System

Noah Ross, Gia Mazza, Jasmina Frederico, and Alex Villalba

A complete assignment tracking system that syncs Moodle assignments to a mobile app with AI-powered push notifications. Built with React Native (Expo), Express.js, Chrome Extension, and OpenAI GPT-4o.

## Project Structure

```
hackathon/
├── api/                   # Express API server
│   ├── server.js          # Express server with SQLite, OpenAI GPT-4o, Expo push
│   ├── package.json       # Server dependencies
│   ├── package-lock.json  # Locked dependency versions
│   ├── .env               # Server environment variables (not committed)
│   ├── hackathon.db       # SQLite database (auto-generated)
│   ├── public/            # Admin web dashboard
│   │   └── dashboard.html # Web-based admin interface
│   └── README.md          # API documentation
├── CLAUDE.md              # Complete technical documentation
├── README.md              # This file
├── hackathon-app/         # Expo React Native app
│   ├── app/              # App routes (Expo Router)
│   │   ├── index.tsx     # Entry point & auth routing
│   │   ├── onboarding.tsx # Email registration screen
│   │   └── (tabs)/
│   │       ├── index.tsx    # Dashboard - assignment list
│   │       ├── explore.tsx  # Explore tab
│   │       └── settings.tsx # Settings - notifications & sign out
│   ├── hooks/
│   │   └── useNotifications.ts  # Push notification hook
│   ├── .env              # Environment variables (not committed)
│   ├── .env.example      # Environment template
│   └── package.json      # App dependencies
└── chrome-extension/      # Chrome extension for Moodle scraping
    ├── manifest.json     # Extension configuration (Manifest V3)
    ├── content.js        # Scrapes assignments from Moodle DOM
    ├── popup.html        # Extension popup UI
    ├── popup.js          # Popup logic & API communication
    └── icons/            # Extension icons
```

## Features

- 📱 **Mobile App** - Beautiful React Native app with SafeAreaView support for modern iPhones
- 🤖 **AI-Powered Notifications** - GPT-4o generates Duolingo-style witty reminders every 60 seconds
- 📚 **Moodle Integration** - Chrome extension scrapes assignments from Lafayette's Moodle calendar
- 🔔 **Real-time Sync** - Extract and sync assignments with one click
- 💾 **SQLite Database** - Persistent storage of users and assignments
- ⚙️ **Settings Screen** - Toggle notifications and sign out functionality
- 📊 **Admin Dashboard** - Web-based dashboard to view all users and assignments
- 🌐 **ngrok Tunneling** - Develop locally with public HTTPS URLs
- 🎯 **Pull-to-Refresh** - Easy assignment syncing in mobile app
- 🔐 **Email-based Auth** - Simple onboarding with email registration

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- [ngrok](https://ngrok.com/) account (free tier works)
- OpenAI API key (for GPT-4o notifications)
- Physical iOS or Android device (notifications don't work in simulators)
- Expo Go app or EAS development build
- Google Chrome browser (for extension)
- Lafayette College Moodle account (for assignment scraping)

## Quick Start

### 1. Install Server Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `api` directory:

```bash
cd api
cat > .env << EOF
PORT=4000
OPENAI_API_KEY=sk-proj-your-api-key-here
EOF
```

Get your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)

### 3. Start the Express Server

```bash
cd api
npm run dev
```

The server will run on `http://localhost:4000`

The server will:

- Create `hackathon.db` SQLite database automatically
- Start cron job for AI-powered notifications (every 60 seconds)
- Serve admin dashboard at `http://localhost:4000`

### 4. Setup ngrok (Required for Mobile App)

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

### 5. Configure the Mobile App

```bash
cd hackathon-app
npm install
cp .env.example .env
```

Edit `.env` and add your ngrok URL:

```
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
```

### 6. Start the Mobile App

```bash
npx expo start
```

- Scan QR code with Expo Go app on your **physical device**
- Or press `i` for iOS simulator / `a` for Android emulator (limited notification support)

**Important:** Push notifications only work on physical devices!

**User Flow:**

1. Enter your email on the onboarding screen
2. Grant notification permissions
3. View the dashboard (empty initially)
4. Use Chrome extension to sync assignments
5. Pull to refresh to see your assignments
6. Receive AI-powered notifications every 60 seconds

### 7. Install Chrome Extension

See [Chrome Extension README](chrome-extension/README.md) for detailed instructions.

**Quick setup:**

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select the `chrome-extension/` directory
4. Navigate to https://moodle.lafayette.edu/calendar/view.php?view=upcoming
5. Click the extension icon in your Chrome toolbar
6. Enter your email and ngrok URL (e.g., `https://abc123.ngrok-free.app`)
7. Click "Sync Assignments"
8. Pull to refresh in the mobile app to see your assignments!

## API Endpoints

### POST /api/register

Register a user with email and/or push token.

**Request Body:**

```json
{
  "email": "student@lafayette.edu",
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully"
}
```

### GET /api/users

Get all registered users.

**Response:**

```json
{
  "count": 5,
  "users": [
    {
      "email": "student@lafayette.edu",
      "push_token": "ExponentPushToken[...]",
      "created_at": "2025-10-18T20:00:00.000Z",
      "last_seen": "2025-10-18T20:30:00.000Z"
    }
  ]
}
```

### POST /api/send-notification

Send a push notification to specific user(s).

**Request Body:**

```json
{
  "email": "student@lafayette.edu", // Optional: specific user
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

### POST /api/assignments

Sync assignments from Chrome extension (replaces all existing assignments for user).

**Request Body:**

```json
{
  "email": "student@lafayette.edu",
  "assignments": [
    {
      "id": "3911473",
      "courseId": "30874",
      "title": "Lab 5 is due",
      "course": "ECE 433.01-Fall 2025",
      "date": "Tuesday, October 21",
      "time": "7:00 AM",
      "description": "No late submissions accepted",
      "actionUrl": "https://moodle.lafayette.edu/...",
      "type": "due",
      "component": "mod_assign"
    }
  ],
  "extractedAt": "2025-10-18T20:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Stored 4 assignments for student@lafayette.edu"
}
```

### GET /api/assignments?email=student@lafayette.edu

Get assignments for a specific user.

**Response:**

```json
{
  "email": "student@lafayette.edu",
  "count": 4,
  "assignments": [...]
}
```

## How It Works

### Complete Data Flow

1. **User Onboarding:**

   - User enters email on mobile app
   - App saves email to AsyncStorage
   - App requests notification permissions
   - App generates Expo Push Token and registers with server

2. **Assignment Syncing:**

   - User opens Chrome extension on Moodle calendar page
   - Extension scrapes assignment data from DOM
   - Extension sends assignments to server with user email
   - Server stores assignments in SQLite database (replaces old ones)
   - Server sends push notification to user

3. **AI-Powered Notifications:**

   - Cron job runs every 60 seconds
   - Server queries users with push tokens
   - For each user with assignments:
     - Sends assignment data to GPT-4o
     - GPT-4o generates witty, Duolingo-style reminder
     - Server sends personalized push notification
   - User receives notification on their device

4. **Mobile App:**
   - Dashboard displays assignments from server
   - Pull-to-refresh syncs latest data
   - Settings screen to toggle notifications and sign out
   - SafeAreaView ensures proper display on modern iPhones

### Example AI Notification

GPT-4o receives:

```
Assignments:
- Philosophy Essay (Due: Tomorrow, 11:59 PM)
- Math Homework (Due: Friday, 9:00 AM)
- Lab Report (Due: Monday, 5:00 PM)
```

GPT-4o generates:

> "Still working on that Philosophy essay? The deadline won't extend itself... 📝"

## Admin Dashboard

Access the web dashboard at your server URL (e.g., `http://localhost:4000` or `https://your-ngrok-url.ngrok-free.app`)

**Features:**

- View all registered users with push tokens
- See all assignments across all users
- Filter assignments by email
- Send custom notifications to specific users or everyone
- Auto-refreshes every 30 seconds
- Real-time stats (user count, assignment count, active tokens)

**Note:** No authentication - keep the URL private in production!

## Testing the System

### End-to-End Test

1. Open mobile app and complete onboarding with your email
2. Open Chrome extension on Moodle calendar page
3. Enter same email and server URL in extension
4. Click "Sync Assignments"
5. Pull to refresh in mobile app - assignments should appear
6. Wait up to 60 seconds - you should receive AI-generated notification
7. Check admin dashboard to see your user and assignments

### Manual API Testing

**Send a custom notification:**

```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/api/send-notification \
  -H "Content-Type: application/json" \
  -H "ngrok-skip-browser-warning: true" \
  -d '{
    "email": "student@lafayette.edu",
    "title": "Test Notification",
    "body": "This is a test message!"
  }'
```

**Get all users:**

```bash
curl https://your-ngrok-url.ngrok-free.app/api/users \
  -H "ngrok-skip-browser-warning: true"
```

**Get assignments for a user:**

```bash
curl "https://your-ngrok-url.ngrok-free.app/api/assignments?email=student@lafayette.edu" \
  -H "ngrok-skip-browser-warning: true"
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

1. **Terminal 1:** `cd api && npm run dev` (server)
2. **Terminal 2:** `ngrok http 4000` (tunnel)
3. **Terminal 3:** `cd hackathon-app && npx expo start` (app)

If ngrok restarts and the URL changes:

1. Copy the new URL
2. Update `hackathon-app/.env`
3. Restart the Expo app

## Mobile App Screens

### 1. Onboarding Screen (`app/onboarding.tsx`)

- Email input field
- Registration button
- Automatic navigation to dashboard after registration

### 2. Dashboard (`app/(tabs)/index.tsx`)

- Header with user email
- Assignment cards with course, date, time, description
- Pull-to-refresh functionality
- Empty state with Chrome extension instructions
- Push notification status indicator
- SafeAreaView for notch support

### 3. Settings (`app/(tabs)/settings.tsx`)

- Account section showing email
- Notification toggle switch
- Sign out button with confirmation dialog
- App version footer

### 4. Explore Tab (`app/(tabs)/explore.tsx`)

- Example screen with app documentation

## Troubleshooting

### AI Notifications Not Generating

- Check that `OPENAI_API_KEY` is set correctly in `.env`
- Verify OpenAI API key is valid and has credits
- Check server logs for OpenAI errors
- Fallback messages will be used if GPT-4o fails

### Notifications Not Appearing

- Grant notification permissions in Settings screen
- Use a **physical device** (simulators don't support push)
- On iOS, close app completely to see banners
- Verify push token is registered via admin dashboard

### Cannot Connect to Server

- Check server is running on port 4000
- Verify ngrok is running: `curl https://your-ngrok-url.ngrok-free.app/`
- Update `hackathon-app/.env` with correct ngrok URL
- Restart Expo app after changing `.env`
- Ensure `ngrok-skip-browser-warning` header is included

### Assignments Not Syncing

- Use same email in mobile app and Chrome extension
- Navigate to Moodle calendar page before clicking extension
- Check server logs for POST /api/assignments errors
- Pull to refresh in mobile app after syncing
- Check admin dashboard to verify assignments were stored

### Chrome Extension Not Working

- Enable Developer Mode in chrome://extensions
- Reload extension after making changes
- Check browser console for errors
- Ensure you're on Moodle calendar page
- Extension auto-opens correct page if needed

## Database

The server uses SQLite with the following schema:

**users table:**

- `email` (TEXT PRIMARY KEY)
- `push_token` (TEXT)
- `created_at` (DATETIME)
- `last_seen` (DATETIME)

**assignments table:**

- `id` (TEXT PRIMARY KEY)
- `email` (TEXT, FOREIGN KEY)
- `course_id`, `title`, `course`, `date`, `time`
- `description`, `action_url`, `type`, `component`
- `extracted_at`, `created_at`

**Access database:**

```bash
cd api
sqlite3 hackathon.db
.tables
SELECT * FROM users;
SELECT * FROM assignments;
```

## Production Deployment

### Server (Railway, Render, Fly.io, AWS)

1. Deploy server to cloud provider
2. Set environment variables:
   - `PORT=4000`
   - `OPENAI_API_KEY=sk-proj-...`
3. SQLite database will persist on disk
4. For scale, consider PostgreSQL instead of SQLite
5. Add authentication to admin dashboard
6. Implement rate limiting

### Mobile App

1. Update `.env` with production server URL
2. Build for iOS: `eas build --platform ios`
3. Build for Android: `eas build --platform android`
4. Test thoroughly on physical devices
5. Submit to App Store: `eas submit --platform ios`
6. Submit to Play Store: `eas submit --platform android`

### Chrome Extension

1. Create icons (16x16, 48x48, 128x128)
2. Update server URL in extension
3. Zip extension folder
4. Submit to Chrome Web Store Developer Dashboard
5. Fill out store listing
6. Submit for review

## Tech Stack

**Server:**

- Express.js
- better-sqlite3 (SQLite database)
- expo-server-sdk (push notifications)
- openai (GPT-4o integration)
- node-cron (scheduled jobs)
- dotenv, cors

**Mobile App:**

- React Native
- Expo (SDK 52+)
- Expo Router (file-based routing)
- expo-notifications (push notifications)
- TypeScript
- AsyncStorage

**Chrome Extension:**

- Manifest V3
- Vanilla JavaScript
- DOM scraping

**Dev Tools:**

- ngrok (tunneling)
- nodemon (auto-restart)

## Project Stats

- **Lines of Code**: ~1,800 lines
- **Technologies**: 15+
- **Components**: 4 (Server, Mobile App, Chrome Extension, Admin Dashboard)
- **AI Integration**: GPT-4o for personalized notifications
- **Database**: SQLite with 2 tables
