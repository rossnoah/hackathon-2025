# Moodle Assignment Tracker - Chrome Extension

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

1. **Start your server:**
   ```bash
   cd /Users/noah/Code/hackathon
   npm run dev
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 4000
   ```

3. **Navigate to Moodle:**
   - Go to https://moodle.lafayette.edu/calendar/view.php?view=upcoming&course=1
   - Make sure you're logged in

4. **Configure the extension:**
   - Click the extension icon in Chrome toolbar
   - Enter your ngrok URL (e.g., `https://your-url.ngrok-free.app`)

### Extract and Sync Assignments

1. While on the Moodle calendar page, click the extension icon
2. Click **Extract Assignments**
3. Review the extracted assignments in the popup
4. Click **Send to Server** to sync with your server
5. A push notification will be sent to your mobile app!

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
├── manifest.json       # Extension configuration
├── content.js         # DOM scraping script
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
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

## Future Enhancements

- [ ] Auto-sync on interval
- [ ] Filter assignments by course
- [ ] Due date reminders
- [ ] Calendar integration
- [ ] Assignment completion tracking
