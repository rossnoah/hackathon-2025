# Hackathon API Server

Express.js server for the Assignment Tracker system with SQLite database, OpenAI GPT-4o integration, and Expo push notifications.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file:**

   ```bash
   cat > .env << EOF
   PORT=4000
   OPENAI_API_KEY=sk-proj-your-api-key-here
   EOF
   ```

3. **Start the server:**
   ```bash
   npm run dev    # Development with auto-reload
   # or
   npm start      # Production mode
   ```

## Environment Variables

- `PORT` - Server port (default: 4000)
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o notifications

## Files

- `server.js` - Express server with all API routes
- `hackathon.db` - SQLite database (auto-created on first run)
- `package.json` - Dependencies and scripts
- `.env` - Environment variables (not committed)
- `public/` - Admin web dashboard (served at `/`)

## API Endpoints

- `GET /` - Admin dashboard
- `POST /api/register` - Register user
- `GET /api/users` - Get all users
- `POST /api/assignments` - Sync assignments
- `GET /api/assignments?email=X` - Get user's assignments
- `POST /api/screentime` - Submit screen time data
- `GET /api/insights/:email` - Get AI insights
- `POST /api/send-notification` - Send push notification
- `POST /api/toggle-notifications` - Toggle notifications

## Database Schema

### users

- `email` (PRIMARY KEY)
- `push_token`
- `notifications_enabled`
- `created_at`
- `last_seen`

### assignments

- `id` (PRIMARY KEY)
- `email` (FOREIGN KEY)
- `course_id`, `title`, `course`, `date`, `time`
- `description`, `action_url`, `type`, `component`
- `extracted_at`, `created_at`

### screentime

- `id` (PRIMARY KEY)
- `email` (FOREIGN KEY)
- `app_usage` (JSON)
- `total_usage_minutes`
- `date`
- `created_at`

## Features

- 🔔 AI-powered push notifications (GPT-4o)
- 📊 SQLite database with automated schema creation
- ⏰ Scheduled notifications every 60 seconds (node-cron)
- 🎯 User-specific assignment tracking
- 📱 Screen time tracking and insights
- 🌐 CORS-enabled for cross-origin requests

## Access Database

```bash
cd api
sqlite3 hackathon.db
.tables
SELECT * FROM users;
SELECT * FROM assignments;
```
