# Clocked Moodle Assignment Tracker Sync - Chrome Extension

A Chrome extension that extracts assignments from Lafayette College's Moodle calendar and sends them to your notification server.

## Features

- 🔍 Automatically scrapes assignments from Moodle calendar
- 📤 Sends assignments to your server via API
- 📱 Triggers push notifications to your mobile app
- 💾 Stores extracted assignments locally
- ⚡ One-click extraction and sync

## Installation

### 1. Prepare Icon Assets

The extension needs icon files. You can:

**Option A: Use a simple placeholder**

```bash
# Create simple colored square icons (requires ImageMagick)
cd chrome-extension/icons
convert -size 16x16 xc:#007bff icon16.png
convert -size 48x48 xc:#007bff icon48.png
convert -size 128x128 xc:#007bff icon128.png
```

**Option B: Use a proper icon**

- Create or download PNG icons in 16x16, 48x48, and 128x128 sizes
- Place them in `chrome-extension/icons/`
- Name them `icon16.png`, `icon48.png`, `icon128.png`

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension` directory
5. The extension should now appear in your extensions list

## Usage

### First Time Setup

**Note: The API URL is now baked into the extension** - no need to configure the server URL manually!

1. **Configure the API URL (one-time setup):**

   - The API URL is stored in `.env` and `config.js`
   - Current URL: `http://f8g08g0s8ggkcg0g4g8os08s.3.89.141.68.sslip.io`
   - To change it, update both `.env` and `config.js`

2. **Navigate to Moodle:**

   - Go to https://moodle.lafayette.edu/calendar/view.php?view=upcoming&course=1
   - Make sure you're logged in

3. **Configure the extension:**
   - Click the extension icon in Chrome toolbar
   - Enter your email address (e.g., `your.email@lafayette.edu`)
   - This will auto-register you with the server

### Extract and Sync Assignments

1. Click the extension icon in Chrome toolbar
2. Enter your email (if not already saved)
3. Click **Sync Assignments**
4. The extension will:
   - Automatically open the Moodle calendar page (if not already there)
   - Extract all assignments from the page
   - Send them to the server
   - Trigger a push notification to your mobile app
5. The popup will stay open during the process!

## How It Works

### Content Script (`content.js`)

- Runs automatically on Moodle calendar pages
- Extracts assignment data from the DOM:
  - Assignment title
  - Course name
  - Due date and time
  - Description
  - Action URL
- Stores assignments in Chrome's local storage

### Popup (`popup.html` & `popup.js`)

- Provides user interface for:
  - Configuring server URL
  - Triggering manual extraction
  - Viewing extracted assignments
  - Sending data to server

### Server Integration

The extension sends assignment data to these endpoints:

**POST /api/assignments**

```json
{
  "assignments": [
    {
      "id": "3911473",
      "courseId": "30874",
      "title": "Lab 5 is due",
      "course": "ECE 433.01-Fall 2025",
      "date": "Tuesday, October 21",
      "time": "7:00 AM",
      "description": "No late submissions accepted",
      "actionUrl": "https://moodle.lafayette.edu/mod/assign/...",
      "type": "due",
      "component": "mod_assign"
    }
  ],
  "extractedAt": "2025-10-18T20:00:00.000Z"
}
```

**POST /api/send-notification**

- Automatically triggered after syncing assignments
- Sends push notification to all registered mobile devices

## Development

### File Structure

```
chrome-extension/
├── manifest.json       # Extension configuration (Manifest V3)
├── config.js          # API URL configuration (baked-in)
├── .env               # Environment variables (not committed)
├── background.js      # Background service worker (handles tab navigation)
├── content.js         # DOM scraping script
├── popup.html         # Extension popup UI (simplified, no server URL field)
├── popup.js           # Popup logic (uses CONFIG.API_URL)
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

### Testing

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test on Moodle calendar page

### Debugging

- **Content Script:** Right-click on Moodle page → Inspect → Console tab
- **Popup:** Right-click extension icon → Inspect popup
- **Server:** Check terminal running `npm run dev`

## Troubleshooting

### Extension not working

- Make sure you're on the Moodle calendar page
- Check Chrome DevTools console for errors
- Verify extension is enabled in `chrome://extensions/`

### No assignments extracted

- Ensure the page has fully loaded
- Check if the DOM structure matches the selectors in `content.js`
- View the Moodle calendar in "Upcoming events" view

### Server connection errors

- Verify ngrok is running
- Check server URL is correct (no trailing slash)
- Make sure server is running on port 4000
- Check browser console for network errors

## Privacy & Security

- All assignment data is stored locally in Chrome storage
- Data is only sent to YOUR server (configured by you)
- No third-party services are used
- Extension only activates on `moodle.lafayette.edu` domain

## Key Features (New!)

✅ **Baked-in API URL** - No need to manually enter server URL
✅ **Popup stays open** - Extension popup doesn't close when navigating to Moodle
✅ **Background service worker** - Handles tab navigation seamlessly
✅ **Auto-registration** - Registers user with server when email is entered
✅ **Simplified UI** - Only email field needed, server URL is pre-configured

## Auto-Sync Feature ⚡

**NEW!** The extension now automatically syncs your assignments every minute in the background!

### How Auto-Sync Works

1. **Automatic Setup**: When you install or update the extension, a background alarm is created
2. **Every Minute**: The extension automatically:
   - Opens the Moodle calendar page in the background (or uses an existing tab)
   - Extracts all current assignments
   - Sends them to the server
   - Updates your mobile app
3. **Silent Operation**: All syncing happens in the background - no tabs popping up!
4. **Status Display**: The popup shows:
   - Auto-sync status (Active/Inactive)
   - Last sync time (e.g., "2 minutes ago")

### Testing Auto-Sync

1. **Install/Reload the Extension**:

   ```
   chrome://extensions/ → Click reload button
   ```

2. **Check Auto-Sync Status**:

   - Click the extension icon
   - You should see: "🦇 Auto-sync: Active (every 1 minute)"
   - Last sync time will update automatically

3. **Monitor Background Activity**:

   - Go to `chrome://extensions/`
   - Click "Inspect views: service worker" under the extension
   - View console logs showing sync activity every minute

4. **Verify Syncing**:
   - Open your mobile app
   - Pull to refresh after 1-2 minutes
   - Assignments should auto-update without manual intervention!

### Manual Sync Still Available

- Click "Sync Now (Manual)" button to force an immediate sync
- Useful if you want to sync right away instead of waiting for the next auto-sync

### Configuration

- Auto-sync interval: **1 minute** (hardcoded in `background.js`)
- To change: Edit `SYNC_INTERVAL_MINUTES` in `background.js`
- Requires user email to be configured

### Debugging Auto-Sync

**Check if alarm is set:**

```javascript
// In browser console (on extension popup):
chrome.alarms.getAll().then(console.log);
```

**View background worker logs:**

- Go to `chrome://extensions/`
- Find "Clocked Moodle Sync"
- Click "Inspect views: service worker"
- Watch console for sync activity

**Common Issues:**

- ❌ "Auto-sync: Inactive" → Reload the extension
- ❌ No syncs happening → Check background worker console for errors
- ❌ "No email configured" → Enter your email in the popup

## Future Enhancements

- [x] Auto-sync on interval ✅ **DONE!**
- [ ] Configurable sync interval
- [ ] Filter assignments by course
- [ ] Due date reminders
- [ ] Calendar integration
- [ ] Assignment completion tracking
- [ ] Sync only when Moodle tab is active
