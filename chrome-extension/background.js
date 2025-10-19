// Background service worker for Blinky Moodle Sync
// Automatically syncs assignments every minute

console.log("🦇 Blinky background service worker started");

// Import config
importScripts('config.js');

const SERVER_URL = CONFIG.API_URL;
const SYNC_INTERVAL_MINUTES = 1; // Sync every 1 minute

// Create alarm on extension install/update
chrome.runtime.onInstalled.addListener(async () => {
  console.log("📦 Extension installed/updated, setting up alarm");

  // Create a repeating alarm that fires every minute
  chrome.alarms.create('syncAssignments', {
    delayInMinutes: SYNC_INTERVAL_MINUTES,
    periodInMinutes: SYNC_INTERVAL_MINUTES
  });

  console.log(`⏰ Alarm created: syncing every ${SYNC_INTERVAL_MINUTES} minute(s)`);
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncAssignments') {
    console.log("⏰ Sync alarm triggered");
    await performAutoSync();
  }
});

// Perform automatic sync
async function performAutoSync() {
  let createdTabId = null; // Track if we created a new tab

  try {
    // Get user email from storage
    const result = await chrome.storage.local.get(['email']);

    if (!result.email) {
      console.log("❌ No email configured, skipping sync");
      return;
    }

    const email = result.email;
    console.log(`🔄 Starting auto-sync for ${email}`);

    // Find or create a Moodle calendar tab
    const moodleUrl = 'https://moodle.lafayette.edu/calendar/view.php?view=upcoming&course=1';

    // Check if there's already a Moodle tab open
    const tabs = await chrome.tabs.query({ url: 'https://moodle.lafayette.edu/calendar/*' });

    let targetTab;
    let shouldCloseTab = false;

    if (tabs.length > 0) {
      // Use existing tab
      targetTab = tabs[0];
      console.log(`📑 Found existing Moodle tab: ${targetTab.id}`);

      // Reload the tab to get fresh data
      await chrome.tabs.reload(targetTab.id);

      // Wait for reload to complete
      await waitForTabLoad(targetTab.id);
    } else {
      // Create new tab in background
      console.log("📑 Creating new Moodle tab in background");
      targetTab = await chrome.tabs.create({
        url: moodleUrl,
        active: false // Don't switch to the tab
      });

      createdTabId = targetTab.id;
      shouldCloseTab = true; // Mark for closure since we created it

      // Wait for page to load
      await waitForTabLoad(targetTab.id);
    }

    // Wait a bit more for the page to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract assignments from the tab
    console.log("📚 Extracting assignments...");

    try {
      const response = await chrome.tabs.sendMessage(targetTab.id, { action: 'extractAssignments' });

      if (response?.assignments) {
        const assignments = response.assignments;
        console.log(`✅ Extracted ${assignments.length} assignments`);

        if (assignments.length > 0) {
          // Send to server
          await sendAssignmentsToServer(email, assignments);

          // Store in local storage
          await chrome.storage.local.set({
            lastExtractedAssignments: assignments,
            lastSyncTime: new Date().toISOString()
          });
        } else {
          console.log("📭 No assignments found");
        }
      }
    } catch (error) {
      console.error("❌ Error extracting assignments:", error);
    } finally {
      // Close the tab if we created it
      if (shouldCloseTab && createdTabId) {
        try {
          await chrome.tabs.remove(createdTabId);
          console.log(`🗑️ Closed auto-created tab: ${createdTabId}`);
        } catch (error) {
          console.error("❌ Error closing tab:", error);
        }
      }
    }

  } catch (error) {
    console.error("❌ Auto-sync failed:", error);

    // Try to close the tab if we created it and there was an error
    if (createdTabId) {
      try {
        await chrome.tabs.remove(createdTabId);
        console.log(`🗑️ Closed tab after error: ${createdTabId}`);
      } catch (err) {
        console.error("❌ Error closing tab after failure:", err);
      }
    }
  }
}

// Send assignments to server
async function sendAssignmentsToServer(email, assignments) {
  try {
    console.log(`📡 Sending ${assignments.length} assignments to server...`);

    const response = await fetch(`${SERVER_URL}/api/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        email,
        assignments,
        extractedAt: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Successfully synced ${assignments.length} assignments`);

      // Send notification
      await fetch(`${SERVER_URL}/api/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          email,
          title: 'Assignments Updated',
          body: `${assignments.length} assignments synced from Moodle`,
          data: { type: 'sync', count: assignments.length },
        }),
      });
    } else {
      console.error("❌ Server error:", data.error || 'Unknown error');
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
}

// Helper function to wait for tab to finish loading
function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);

    // Timeout after 30 seconds
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, 30000);
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'manualSync') {
    performAutoSync().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});

console.log("✅ Background service worker ready");
