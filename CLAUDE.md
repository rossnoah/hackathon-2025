# Clocked Assignment Tracker System - Technical Documentation

## Overview

A complete assignment tracking system that syncs Moodle assignments to a mobile app with AI-powered push notifications. Built with React Native (Expo), Express.js, Chrome Extension, and OpenAI GPT-4o.

## System Architecture

```
┌─────────────────┐
│ Moodle Calendar │
└────────┬────────┘
         │
         │ (scrapes)
         ↓
┌─────────────────┐     ┌──────────────┐
│ Chrome Extension│────→│ Express.js   │
│  (popup.js)     │     │   Server     │
└─────────────────┘     │(api/server.js)│
                        └──────┬───────┘
                               │
                    ┌──────────┼──────────┐
                    ↓          ↓          ↓
            ┌──────────┐  ┌────────┐  ┌──────┐
            │ SQLite   │  │ OpenAI │  │ Expo │
            │ Database │  │ GPT-4o │  │ Push │
            └──────────┘  └────────┘  └───┬──┘
                                          │
                                          ↓
                                  ┌──────────────┐
                                  │ React Native │
                                  │   Mobile App │
                                  └──────────────┘
```

## Components

### 1. Chrome Extension (`/chrome-extension/`)

**Purpose**: Scrapes assignments from Lafayette College's Moodle calendar and sends to server.

**Files**:

- `manifest.json` - Extension configuration (Manifest V3)
- `content.js` - DOM scraping script that extracts assignment data
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic and API communication

**How it works**:

1. User enters their email and server URL in popup
2. Clicks "Sync Assignments" button
3. Opens Moodle calendar page (if not already there)
4. Content script extracts all assignment data:
   - Title, course, date, time
   - Event ID, course ID, description
   - Action URL and event type
5. Sends data to server `/api/assignments` endpoint
6. Triggers push notification to user

**Key Functions**:

```javascript
// In content.js
function extractAssignments() {
  // Finds all [data-type="event"] elements
  // Extracts assignment metadata from data attributes
  // Returns array of assignment objects
}

// In popup.js
async function extractAndSend(tabId, serverUrl, email) {
  // Sends message to content script
  // Receives assignments
  // POSTs to /api/assignments
  // Sends notification
}
```

### 2. Express Server (`/api/server.js`)

**Purpose**: Central backend handling user registration, assignment storage, notifications, and AI-generated reminders.

**Dependencies**:

```json
{
  "express": "Web server framework",
  "better-sqlite3": "SQLite database",
  "expo-server-sdk": "Push notifications",
  "openai": "GPT-4o integration",
  "node-cron": "Scheduled jobs",
  "dotenv": "Environment variables",
  "cors": "Cross-origin requests"
}
```

**Database Schema**:

```sql
-- Users table
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  push_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table
CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  email TEXT,
  course_id TEXT,
  title TEXT,
  course TEXT,
  date TEXT,
  time TEXT,
  description TEXT,
  action_url TEXT,
  type TEXT,
  component TEXT,
  extracted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email) REFERENCES users(email)
);

-- Screentime tracking table
CREATE TABLE screentime (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  app_usage TEXT,
  total_usage_minutes INTEGER,
  date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email) REFERENCES users(email)
);
```

**API Endpoints**:

| Method | Endpoint                   | Description                                                  |
| ------ | -------------------------- | ------------------------------------------------------------ |
| GET    | `/`                        | Serves admin dashboard                                       |
| POST   | `/api/register`            | Register user with email and/or push token                   |
| POST   | `/api/send-notification`   | Send push notification to user(s)                            |
| GET    | `/api/users`               | Get all registered users                                     |
| POST   | `/api/assignments`         | Store assignments for a user (replaces old ones)             |
| GET    | `/api/assignments?email=X` | Get assignments for user                                     |
| POST   | `/api/screentime`          | Store user's app usage data                                  |
| GET    | `/api/insights/:email`     | Get AI insights about procrastination + personalized message |

**AI-Powered Notifications**:

```javascript
// Runs every 60 seconds
cron.schedule("*/15 * * * *", async () => {
  // 1. Get all users with push tokens
  // 2. For each user with assignments:
  //    a. Generate Duolingo-style message with GPT-4o
  //    b. Send personalized push notification
});
```

**GPT-4o Prompt**:

- Model: `gpt-4o`
- Temperature: `1.0` (high creativity)
- System role: "Witty, passive-aggressive notification bot like Duolingo"
- Context: User's specific assignments (titles, courses, dates)
- Output: Short (2 sentences max), funny, personalized reminder

**Example Generated Messages**:

- "Still working on that Philosophy essay? The deadline won't extend itself... 📝"
- "3 assignments due soon! Let's knock them out before they multiply 💪"
- "I'm not mad, just disappointed you haven't checked your assignments yet 📚"
- "If scrolling was an Olympic sport, you'd already have the gold, but unfortunately, TikTok won't help you titrate your way out of that chemistry lab due in two days."
- "Ah, yes, the ancient philosophers Plato and Aristotle, famous for their TikTok battles. Pro tip: your Philosophy Essay will appreciate more thought than your latest video scroll!"

### 3. React Native Mobile App (`/hackathon-app/`)

**Purpose**: Mobile interface for viewing assignments and receiving push notifications.

**Tech Stack**:

- Expo Router (file-based routing)
- TypeScript
- AsyncStorage (local persistence)
- Expo Notifications

**App Structure**:

```
app/
├── index.tsx              # Entry point - checks auth, routes to onboarding or tabs
├── onboarding.tsx         # Email registration screen
├── _layout.tsx            # Root layout with Stack navigator
├── (tabs)/
│   ├── index.tsx          # Dashboard - shows assignments
│   ├── explore.tsx        # Explore tab
│   └── _layout.tsx        # Tabs layout
└── modal.tsx              # Example modal
```

**User Flow**:

1. **First Launch** → `index.tsx`

   - Shows loading spinner
   - Checks AsyncStorage for `userEmail`
   - No email → routes to `onboarding.tsx`
   - Has email → routes to `(tabs)/index.tsx`

2. **Onboarding** → `onboarding.tsx`

   - User enters email
   - Saves to AsyncStorage
   - Registers with server (`POST /api/register`)
   - Routes to dashboard

3. **Dashboard** → `(tabs)/index.tsx` - **Redesigned with AI Insights**

   - Shows social media percentage (e.g., "31% of your day")
   - Displays AI-generated guilt/motivation message about procrastination
   - Shows top 3 apps used with time spent
   - Displays top 3 urgent assignments in red ("You should really be doing these:")
   - Lists all assignments below for reference
   - Pull-to-refresh to update insights
   - Shows push token status at bottom

4. **Screen Time Tab** → `(tabs)/explore.tsx` - **Enhanced with Visuals**
   - Shows total screen time for the day
   - App emoji indicators (🎬 TikTok, 📸 Instagram, etc.)
   - Warning badges for distraction apps
   - Color-coded app cards (orange/red for procrastination apps)
   - Progress bars showing usage percentage
   - "Send Screen Time to AI" button
   - Info card explaining the feature

**Key Files**:

`hooks/useNotifications.ts`:

```typescript
export function useNotifications() {
  // 1. Requests notification permissions
  // 2. Gets Expo push token
  // 3. Registers with server (email + pushToken)
  // 4. Listens for notifications
  // 5. Returns { expoPushToken, notification }
}
```

`app/(tabs)/index.tsx`:

```typescript
// Loads user email from AsyncStorage
// Fetches assignments: GET /api/assignments?email=X
// Displays assignment cards or empty state
// Pull-to-refresh functionality
```

### 4. Admin Dashboard (`/api/public/dashboard.html`)

**Purpose**: Web-based admin panel for monitoring users and sending notifications.

**Features**:

- View all registered users with push tokens
- See all assignments across all users
- Filter assignments by email
- Send custom notifications to specific users or everyone
- Auto-refreshes every 30 seconds
- Real-time stats (user count, assignment count, active tokens)

**Usage**:

- Accessible at server root URL (e.g., `https://your-ngrok-url.ngrok-free.app`)
- No authentication (keep private!)

## Environment Setup

### Environment Variables

Create `.env` file in `api/` directory:

```bash
cd api
cat > .env << EOF
PORT=4000
OPENAI_API_KEY=sk-proj-...
EOF
```

### Development Workflow

1. **Start ngrok** (for local development):

```bash
ngrok http 4000
```

2. **Update mobile app `.env`**:

```env
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok-free.app
```

3. **Start server**:

```bash
cd api
npm run dev
```

4. **Start mobile app**:

```bash
cd hackathon-app
npm start
```

5. **Load Chrome extension**:
   - Open Chrome → Extensions → Developer Mode
   - Load unpacked → select `chrome-extension/` folder
   - Enter server URL and email

### First-Time Setup Checklist

- [ ] Run `npm install` in `api/` directory
- [ ] Run `npm install` in `hackathon-app/` directory
- [ ] Create `.env` file with OpenAI API key
- [ ] Start ngrok tunnel
- [ ] Update mobile app `.env` with ngrok URL
- [ ] Start server
- [ ] Install Chrome extension
- [ ] Test flow: Extension → Sync → Mobile App → View Assignments

## Data Flow

### Assignment Sync Flow

```
1. User clicks "Sync Assignments" in Chrome extension
   ↓
2. Extension opens Moodle calendar page
   ↓
3. Content script extracts assignments from DOM
   ↓
4. Popup sends to server: POST /api/assignments
   Body: { email, assignments[], extractedAt }
   ↓
5. Server deletes old assignments for user
   ↓
6. Server inserts new assignments into database
   ↓
7. Server sends notification to user's mobile app
   ↓
8. User pulls to refresh in mobile app
   ↓
9. Mobile app fetches: GET /api/assignments?email=X
   ↓
10. Displays updated assignments
```

### Notification Flow

```
1. Cron job runs every 60 seconds
   ↓
2. Server queries: SELECT users with push_token IS NOT NULL
   ↓
3. For each user:
   a. Get their assignments
   b. If assignments.length > 0:
      - Send assignments to GPT-4o
      - Generate Duolingo-style message
      - Send push notification via Expo
   ↓
4. Mobile app receives notification
   ↓
5. User sees notification on device
   ↓
6. Tapping opens app to dashboard
```

## Key Technical Decisions

### Why SQLite?

- Simple, file-based database
- No external dependencies
- Perfect for hackathon/prototype
- Easy to inspect (`hackathon.db` file)

### Why Expo Router?

- File-based routing (like Next.js)
- Built-in navigation
- Easy deep linking support
- Modern React Native architecture

### Why node-cron?

- Simple scheduling
- Runs in-process (no external scheduler needed)
- Good for development/prototyping
- Production note: Use proper job queue (Bull, Agenda) for scale

### Why GPT-4o for Notifications?

- Generates creative, varied messages
- Personalizes based on assignment context
- Makes notifications feel fresh (not repetitive)
- Duolingo-style engagement = better retention

### Why Chrome Extension vs. Mobile Scraping?

- Moodle requires authentication
- Extension has access to logged-in session
- Avoid credential storage/handling
- User stays in control of their data

## Common Issues & Solutions

### Issue: Push notifications not working

**Solution**:

- Must use physical device (not simulator)
- Check push token is registered in database
- Verify ngrok URL is correct in mobile app
- Check server logs for notification errors

### Issue: Chrome extension can't find assignments

**Solution**:

- Make sure you're on Moodle calendar page
- URL should contain `moodle.lafayette.edu/calendar`
- Extension auto-opens correct page if not there
- Check console for extraction logs

### Issue: App shows black screen

**Solution**:

- Check `index.tsx` is routing correctly
- Clear AsyncStorage: `AsyncStorage.clear()`
- Restart app
- Check for navigation loops in logs

### Issue: GPT-4o notifications fail

**Solution**:

- Verify OpenAI API key in `.env`
- Check API quota/billing
- Fallback messages will be used automatically
- Check server logs for OpenAI errors

### Issue: Assignments not showing in app

**Solution**:

- Pull to refresh dashboard
- Check server logs - assignments stored?
- Verify email matches in extension and app
- Check API endpoint: GET /api/assignments?email=X

## Database Queries

### Useful SQL Commands

```sql
-- View all users
SELECT * FROM users;

-- View all assignments
SELECT * FROM assignments;

-- Count assignments per user
SELECT email, COUNT(*) as count
FROM assignments
GROUP BY email;

-- Find users without push tokens
SELECT * FROM users WHERE push_token IS NULL;

-- Delete all assignments for a user
DELETE FROM assignments WHERE email = 'user@email.com';

-- Clear all data
DELETE FROM users;
DELETE FROM assignments;
```

Access database:

```bash
sqlite3 hackathon.db
```

## Security Notes

⚠️ **This is a hackathon project - NOT production-ready**

Security concerns:

- No authentication on API endpoints
- No rate limiting
- OpenAI API key in server .env (not rotated)
- Admin dashboard has no password
- CORS allows all origins
- No input validation/sanitization
- Push tokens stored in plaintext

For production, add:

- JWT authentication
- Rate limiting (express-rate-limit)
- API key rotation
- Admin authentication
- Input validation (Joi, Zod)
- HTTPS only
- Environment-based CORS
- Encrypted token storage

## Future Enhancements

**Potential Features**:

- [ ] Assignment completion tracking (checkboxes)
- [ ] Due date reminders (X days before)
- [ ] Smart notification timing (based on user activity)
- [ ] Assignment categories/filtering
- [ ] Calendar view in mobile app
- [ ] Dark mode
- [ ] Multiple institution support
- [ ] Assignment priority/importance
- [ ] Study time estimation
- [ ] Streak tracking (daily app usage)
- [ ] Custom notification schedule per user
- [ ] Web app version
- [ ] Assignment notes/comments
- [ ] Sharable assignment lists
- [ ] Integration with Google Calendar
- [ ] iOS widget
- [ ] Android widget

**Technical Improvements**:

- [ ] Add tests (Jest, Detox)
- [ ] Add error boundaries
- [ ] Improve TypeScript types
- [ ] Add logging (Winston)
- [ ] Add monitoring (Sentry)
- [ ] Migrate to PostgreSQL
- [ ] Add Redis for caching
- [ ] Add proper job queue
- [ ] Implement WebSockets for real-time updates
- [ ] Add CI/CD pipeline
- [ ] Add Docker support
- [ ] Add API documentation (Swagger)

## Deployment

### Server Deployment (Production)

**Option 1: Railway/Render/Fly.io**

```bash
# Set environment variables
OPENAI_API_KEY=...
PORT=4000

# Deploy
git push origin main
```

**Option 2: VPS (Digital Ocean, AWS)**

```bash
# Install Node.js
# Clone repo
cd api
npm install
# Set up PM2
pm2 start server.js --name hackathon-api
pm2 save
pm2 startup
```

### Mobile App Deployment

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Chrome Extension Publishing

1. Zip extension folder
2. Go to Chrome Web Store Developer Dashboard
3. Upload ZIP
4. Fill out store listing
5. Submit for review

## New Features: Screentime Insights Dashboard

### Overview

The app now includes an AI-powered procrastination detection system that shows users:

1. **How much time they've spent on social media** (percentage of day)
2. **AI-generated guilt messages** personalized to their apps and assignments
3. **Smart recommendations** to focus on urgent work
4. **Contextual notifications** that call out specific procrastination apps

### How It Works

1. User tracks screen time in the app
2. Clicks "Send Screen Time to AI" in Screen Time tab
3. Data is stored in the database
4. When user refreshes home screen, `/api/insights/:email` endpoint:
   - Fetches latest screentime data
   - Gets user's upcoming assignments
   - Uses GPT-4o to generate personalized message
   - Returns social media %, top apps, and roasting message
5. Dashboard displays insights with beautiful UI
6. Cron job later uses same screentime data for contextual push notifications

### Example Flow

```
User spent: 31% on TikTok + Instagram today
Assignments: Philosophy Essay (due tomorrow), Calculus (due today)
AI Message: "If scrolling was an Olympic sport, you'd already have gold,
but unfortunately, TikTok won't help you finish that Calculus assignment!"
```

## Project Stats

**Lines of Code** (approx):

- Server: ~500 lines (+170 new for insights/screentime)
- Mobile App: ~850 lines (+250 new for dashboard redesign)
- Chrome Extension: ~210 lines
- Dashboard: ~420 lines
- **Total**: ~1,980 lines

**Technologies Used**: 15

- Node.js, Express, SQLite, OpenAI (GPT-4o), Expo
- React Native, TypeScript, AsyncStorage
- Chrome Extensions API, node-cron
- better-sqlite3, expo-notifications
- ngrok, dotenv, CORS

**Time to Build**: Hackathon project (with real-time AI integration)

## Credits

Built with Claude Code by Anthropic

## License

MIT (or whatever you want - it's a hackathon project!)

---

**Last Updated**: 2025-10-18

### Recent Updates (Oct 18, 2025)

- ✨ Added Screentime Insights Dashboard with AI-generated messages
- 🎨 Completely redesigned home dashboard to show procrastination data first
- 📊 Enhanced Screen Time tab with visual indicators and warnings
- 🤖 Integrated GPT-4o for contextual, guilt-inducing reminders
- 💾 Added database table for screentime tracking
- 🔄 Integrated screentime context into push notifications

For questions or issues, check the GitHub repository.
