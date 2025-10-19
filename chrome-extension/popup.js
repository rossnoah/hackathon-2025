let extractedAssignments = [];
const SERVER_URL = CONFIG.API_URL; // Get from config.js

// Load saved data from storage
chrome.storage.local.get(['email'], (result) => {
  if (result.email) {
    document.getElementById('email').value = result.email;
  }
});

// Save email when changed
document.getElementById('email').addEventListener('change', (e) => {
  const email = e.target.value;
  chrome.storage.local.set({ email });

  // Register user with server
  if (email) {
    registerUser(email, SERVER_URL);
  }
});

// Register user with server
async function registerUser(email, serverUrl) {
  try {
    await fetch(`${serverUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    console.error('Error registering user:', error);
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');

  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 5000);
}

// Display assignments
function displayAssignments(assignments) {
  const listDiv = document.getElementById('assignmentList');

  if (assignments.length === 0) {
    listDiv.innerHTML = '<p style="text-align: center; color: #999;">No assignments found</p>';
    listDiv.classList.remove('hidden');
    return;
  }

  listDiv.innerHTML = assignments.map(a => `
    <div class="assignment-item">
      <div class="assignment-title">${a.title || 'Untitled'}</div>
      <div class="assignment-course">${a.course || 'Unknown course'}</div>
      <div class="assignment-date">${a.date || ''} ${a.time || ''}</div>
    </div>
  `).join('');

  listDiv.classList.remove('hidden');
}

// Sync assignments button - trigger manual sync via background worker
document.getElementById('syncBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;

  if (!email) {
    showStatus('Please enter your email', 'error');
    return;
  }

  try {
    showStatus('Starting sync...', 'info');

    // Trigger sync via background worker (same as auto-sync)
    chrome.runtime.sendMessage({ action: 'manualSync' }, (response) => {
      if (response && response.success) {
        showStatus('Sync completed!', 'success');
      } else {
        showStatus('Sync failed: ' + (response?.error || 'Unknown error'), 'error');
      }
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
});

// Helper function to extract and send from a specific tab
async function extractAndSend(tabId, serverUrl, email) {
  showStatus('Extracting assignments...', 'info');

  chrome.tabs.sendMessage(tabId, { action: 'extractAssignments' }, async (response) => {
    if (chrome.runtime.lastError) {
      showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
      console.error('Chrome runtime error:', chrome.runtime.lastError);
      return;
    }

    if (response && response.assignments) {
      extractedAssignments = response.assignments;
      console.log('✅ Extracted assignments:', JSON.stringify(extractedAssignments, null, 2));
      console.log(`Total assignments: ${extractedAssignments.length}`);
      displayAssignments(extractedAssignments);

      if (extractedAssignments.length === 0) {
        showStatus('No assignments found', 'info');
        return;
      }

      // Automatically send to server
      showStatus('Sending to server...', 'info');

      try {
        const response = await fetch(`${SERVER_URL}/api/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            email,
            assignments: extractedAssignments,
            extractedAt: new Date().toISOString(),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          showStatus(`Successfully synced ${extractedAssignments.length} assignments!`, 'success');

          // Also send a notification about new assignments
          await fetch(`${SERVER_URL}/api/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({
              email,
              title: 'Assignments Updated',
              body: `${extractedAssignments.length} assignments synced from Moodle`,
              data: { type: 'assignments', count: extractedAssignments.length },
            }),
          });
        } else {
          showStatus('Error: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
      }
    } else {
      showStatus('No assignments found', 'error');
      console.warn('No assignments in response:', response);
    }
  });
}

// Load previously extracted assignments if available
chrome.storage.local.get(['lastExtractedAssignments', 'lastSyncTime'], (result) => {
  if (result.lastExtractedAssignments) {
    extractedAssignments = result.lastExtractedAssignments;
    displayAssignments(extractedAssignments);
  }

  // Update last sync time
  if (result.lastSyncTime) {
    updateLastSyncTime(result.lastSyncTime);
  }
});

// Update auto-sync status
async function updateAutoSyncStatus() {
  try {
    const alarms = await chrome.alarms.getAll();
    const syncAlarm = alarms.find(a => a.name === 'syncAssignments');

    const statusText = document.getElementById('syncStatusText');

    if (syncAlarm) {
      statusText.textContent = 'Active (every 1 minute)';
      statusText.style.color = '#155724';
    } else {
      statusText.textContent = 'Inactive';
      statusText.style.color = '#721c24';
    }
  } catch (error) {
    console.error('Error checking alarm status:', error);
  }
}

// Update last sync time display
function updateLastSyncTime(isoTimestamp) {
  const lastSyncEl = document.getElementById('lastSyncTime');
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    lastSyncEl.textContent = 'Just now';
  } else if (diffMins < 60) {
    lastSyncEl.textContent = `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    lastSyncEl.textContent = `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
}

// Update status on popup open
updateAutoSyncStatus();

// Listen for storage changes to update last sync time
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.lastSyncTime) {
    updateLastSyncTime(changes.lastSyncTime.newValue);
  }
  if (namespace === 'local' && changes.lastExtractedAssignments) {
    extractedAssignments = changes.lastExtractedAssignments.newValue;
    displayAssignments(extractedAssignments);
  }
});
